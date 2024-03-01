import { useIntl } from "react-intl";
import { Text } from "@components/ui";
import { Config } from "@src/screens/config";
import { IVendorData } from "@config/types";
import { Signin as SigninComponent } from "./signin";

interface ISignin {
  vendorUrl?: string;
  vendorData?: IVendorData;
  passcode?: string;
  signinError?: string;
  handleConnect: (passcode: string) => void;
  isLoading?: boolean;
  logo?: string;
  title?: string;
  afterSetUrl?: () => void;
  showConfig: boolean;
  setShowConfig: (state: boolean) => void;
}

export function Signin(props: ISignin): JSX.Element {
  const { formatMessage } = useIntl();

  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="flex flex-row justify-between p-2">
        <Text className="text-xl capitalize font-bold" $color="primary">
          {props.showConfig
            ? formatMessage({ id: "account.settings" })
            : props.title}
        </Text>
        <button onClick={() => props.setShowConfig(true)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </button>
      </div>
      {props.showConfig ? (
        <Config
          handleBack={() => props.setShowConfig(false)}
          afterSetUrl={props?.afterSetUrl}
        />
      ) : (
        <SigninComponent
          signinError={props?.signinError}
          isLoading={props?.isLoading}
          handleConnect={props.handleConnect}
          logo={props.logo}
        />
      )}
      <div className="text-xs absolute bottom-2 w-full">
        <div className=" text-center">
          <a
            href={props?.vendorData?.onboardingUrl}
            className="font-medium hover:underline"
            target="_blank"
          >
            {formatMessage({ id: "account.onboard.cta" })}
          </a>
        </div>
        <div className=" text-center">
          <a
            href={props?.vendorData?.docsUrl}
            target="_blank"
            className="font-medium hover:underline"
          >
            {formatMessage({ id: "account.docs" })}
          </a>
          <strong> | </strong>
          <a
            href={props?.vendorData?.supportUrl}
            className="font-medium hover:underline"
            target="_blank"
          >
            {formatMessage({ id: "account.support" })}
          </a>
        </div>
      </div>
    </div>
  );
}
