/**
 * Background-Compatible Workflow Loader
 * 
 * This module provides workflow and config loading functionality that works
 * in browser extension background contexts (where window is not available).
 * It uses the extension storage and bundled resources instead of window-dependent APIs.
 */

import yaml from 'js-yaml';

// Import extension-specific APIs with the correct path
import { getExtensionApi } from '../../../shared/browser/extension-api';

// Define embedded workflow content for background context
// These would normally be loaded from files, but for background scripts
// we need to embed them directly or use extension storage
const EMBEDDED_WORKFLOWS: Record<string, string> = {
  'create-client': `
workflow:
  steps:
    gleif_client:
      id: 'gleif_client'
      type: 'create_client'
      agent_name: 'gleif-agent-1'
      description: 'Creating client for gleif agent'
  `,
  'create-client-workflow': `
workflow:
  steps:
    gleif_client:
      id: 'gleif_client'
      type: 'create_client'
      agent_name: 'gleif-agent-1'
      description: 'Creating client for gleif agent'
  `,
  'create-aid-workflow': `
workflow:
  steps:
    gleif_aid:
      id: 'gleif_aid'
      type: 'create_aid'
      aid: 'gleif-aid-1'
      description: 'Creating AID for gleif-aid-1'
  `
};

// Define the config type with any additional properties needed at runtime
interface ExtendedConfig {
  secrets: Record<string, string>;
  agents: Record<string, { 
    secret: string;
    url?: string;
    boot_url?: string;
    passcode?: string;
    bran?: string;
  }>;
  identifiers: Record<string, { agent: string; name: string }>;
  users: Array<{ type: string; alias: string; identifiers: string[] }>;
  credentials: Record<string, any>;
  agentUrl?: string;
  bootUrl?: string;
  bran?: string;
  [key: string]: any; // Allow any additional properties
}

// Default client config for background context
const DEFAULT_CLIENT_CONFIG: ExtendedConfig = {
  secrets: {
    browser_extension: "AUTOGENERATED_AT_RUNTIME" // Will be replaced with real passcode
  },
  agents: {
    browser_extension: {
      secret: "browser_extension"
    }
  },
  identifiers: {
    "browser-extension-aid": {
      agent: "browser_extension",
      name: "browser-extension-aid"
    }
  },
  users: [
    {
      type: "EXTENSION",
      alias: "extension-user",
      identifiers: ["browser-extension-aid"]
    }
  ],
  credentials: {}
};

/**
 * Generates a random passcode
 */
const generateRandomPasscode = (): string => {
  // Generate a random string of characters for use as a passcode
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  const length = 20; // Adjust the length as needed
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Generate a passcode and config for the browser extension
 */
export const generatePasscodeAndConfig = async (): Promise<{ passcode: string; config: ExtendedConfig }> => {
  // Generate a random passcode
  const passcode = generateRandomPasscode();
  
  // Create a config with the generated passcode
  const config: ExtendedConfig = { ...DEFAULT_CLIENT_CONFIG };
  config.secrets.browser_extension = passcode;
  
  return { passcode, config };
};

/**
 * Load a workflow by name from bundled files or fallback sources
 */
export const loadWorkflow = async (workflowName: string) => {
  try {
    // First try to load from the extension's bundled files
    try {
      const browser = getExtensionApi();
      const workflowUrl = browser.runtime.getURL(`src/workflows/${workflowName}.yaml`);
      
      console.log(`[WORKFLOW SOURCE] Attempting to load workflow from file: ${workflowUrl}`);
      const response = await fetch(workflowUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow file: ${response.status}`);
      }
      
      const yamlText = await response.text();
      console.log(`[WORKFLOW SOURCE] SUCCESS: Using workflow from src/workflows/${workflowName}.yaml file`);
      return yaml.load(yamlText);
    } catch (fetchError: any) {
      console.warn(`[WORKFLOW SOURCE] File load failed: ${fetchError.message}`);
      
      // Try using the embedded version as fallback
      const embeddedWorkflow = EMBEDDED_WORKFLOWS[workflowName];
      if (embeddedWorkflow) {
        console.log(`[WORKFLOW SOURCE] Using embedded hardcoded workflow for: ${workflowName}`);
        return yaml.load(embeddedWorkflow);
      }
      
      // If not embedded, try loading from extension storage
      try {
        const browser = getExtensionApi();
        const result = await browser.storage.local.get(`workflow_${workflowName}`);
        const storedWorkflow = result[`workflow_${workflowName}`];
        
        if (storedWorkflow) {
          console.log(`[WORKFLOW SOURCE] Using workflow from extension storage: ${workflowName}`);
          return yaml.load(storedWorkflow);
        }
      } catch (storageError) {
        console.warn(`[WORKFLOW SOURCE] Storage load failed: ${storageError}`);
      }
      
      // Last resort: Return a hardcoded fallback workflow for this name
      console.log(`[WORKFLOW SOURCE] Using hardcoded fallback workflow definition for: ${workflowName}`);
      return getFallbackWorkflow(workflowName);
    }
  } catch (error: any) {
    console.error(`[WORKFLOW SOURCE] Critical error loading workflow: ${error.message}`);
    console.log(`[WORKFLOW SOURCE] Using hardcoded fallback workflow definition as last resort`);
    return getFallbackWorkflow(workflowName);
  }
};

/**
 * Get a fallback workflow definition when all loading methods fail
 * These are hardcoded definitions used when file loading fails
 */
const getFallbackWorkflow = (workflowName: string) => {
  console.log(`[WORKFLOW SOURCE] Creating fallback definition for: ${workflowName}`);
  
  // Provide fallback workflows based on the requested name
  switch (workflowName) {
    case 'create-client-workflow':
    case 'create-client':
      return {
        workflow: {
          steps: {
            gleif_client: {
              id: 'gleif_client',
              type: 'create_client',
              agent_name: 'gleif-agent-1',
              description: 'Creating client for gleif agent (FALLBACK)'
            }
          }
        }
      };
    
    case 'create-aid-workflow':
      return {
        workflow: {
          steps: {
            gleif_aid: {
              id: 'gleif_aid',
              type: 'create_aid',
              aid: 'gleif-aid-1',
              description: 'Creating AID for gleif-aid-1 (FALLBACK)'
            }
          }
        }
      };
      
    default:
      console.warn(`[WORKFLOW SOURCE] No fallback definition for: ${workflowName}`);
      return null;
  }
};

/**
 * Load a configuration by name with runtime values
 */
export const loadConfig = async (configName: string, runtimeValues: any): Promise<ExtendedConfig | null> => {
  try {
    // Try to load from the extension's files first
    try {
      const browser = getExtensionApi();
      const configUrl = browser.runtime.getURL(`src/user_config/${configName}.json`);
      
      console.log(`[CONFIG SOURCE] Attempting to load config from file: ${configUrl}`);
      const response = await fetch(configUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch config file: ${response.status}`);
      }
      
      const configText = await response.text();
      console.log(`[CONFIG SOURCE] SUCCESS: Using config from src/user_config/${configName}.json file`);
      
      // Parse the config
      const config = JSON.parse(configText) as ExtendedConfig;
      
      // Update with runtime values
      if (runtimeValues) {
        // For client creation, ensure the agent has the correct properties
        if (config.agents && config.agents['gleif-agent-1']) {
          // Make sure the agent has the necessary fields
          config.agents['gleif-agent-1'] = {
            ...config.agents['gleif-agent-1'],
            // Add these properties required by vlei-verifier-workflows
            url: runtimeValues.agentUrl,
            boot_url: runtimeValues.bootUrl,
            passcode: runtimeValues.passcode,
            // Add bran if provided
            ...(runtimeValues.bran ? { bran: runtimeValues.bran } : {})
          };
        }
        
        // Store runtime URLs at the top level too
        config.agentUrl = runtimeValues.agentUrl;
        config.bootUrl = runtimeValues.bootUrl;
        
        // Add bran at the top level if provided
        if (runtimeValues.bran) {
          config.bran = runtimeValues.bran;
        }
        
        // For AID creation workflow, update the identifiers section with the AID name
        if (runtimeValues.aidName && config.identifiers) {
          // Create or update the identity with the provided name
          config.identifiers[runtimeValues.aidName] = {
            agent: "gleif-agent-1",
            name: runtimeValues.aidName
          };
        }
      }
      
      return config;
    } catch (fetchError: any) {
      console.warn(`[CONFIG SOURCE] File load failed: ${fetchError.message}`);
      
      // Fall back to default config with runtime values
      console.log(`[CONFIG SOURCE] Using default hardcoded config`);
      const config: ExtendedConfig = { ...DEFAULT_CLIENT_CONFIG };
      
      // Inject runtime values
      if (runtimeValues) {
        // Replace the autogenerated passcode placeholder with the actual passcode
        if (runtimeValues.passcode) {
          config.secrets.browser_extension = runtimeValues.passcode;
        }
        
        // For client creation, ensure the agent has the correct properties
        if (config.agents && config.agents.browser_extension) {
          // Add these properties required by vlei-verifier-workflows
          config.agents.browser_extension = {
            ...config.agents.browser_extension,
            url: runtimeValues.agentUrl,
            boot_url: runtimeValues.bootUrl,
            passcode: runtimeValues.passcode,
            // Add bran if provided
            ...(runtimeValues.bran ? { bran: runtimeValues.bran } : {})
          };
        }
        
        // Store runtime URLs
        config.agentUrl = runtimeValues.agentUrl;
        config.bootUrl = runtimeValues.bootUrl;
        
        // Add bran at the top level if provided
        if (runtimeValues.bran) {
          config.bran = runtimeValues.bran;
        }
        
        // For AID creation workflow, update the identifiers section with the AID name
        if (runtimeValues.aidName) {
          config.identifiers = {
            ...config.identifiers,
            [runtimeValues.aidName]: {
              agent: "gleif-agent-1",
              name: runtimeValues.aidName
            }
          };
        }
      }
      
      return config;
    }
  } catch (error: any) {
    console.error(`[CONFIG SOURCE] Critical error loading config: ${error.message}`);
    return null;
  }
}; 