import HeaderSection from "@/components/shared/sections/header";
import { siteAssets } from "@/helper/assets";
import { getEnabledSocialProviders } from "@/lib/social-providers";
import RegistrationForm from "./_components/registration-form";

const Page = ({
  searchParams,
}: {
  searchParams?: { intent?: string };
}) => {
  const intent = searchParams?.intent === "subscribe" ? "subscribe" : undefined;

  return (
    <div>
      <HeaderSection
        imageUrl={siteAssets.registrationPage}
        title="Crea tu cuenta"
        description="Únete a nuestra plataforma para acceder a recursos legales completos"
      />

      <div className="my-[50px] md:my-[100px] container max-w-[830px] w-full mx-auto md:px-[60px] md:py-[30px] md:shadow-[0px_4px_12px_0px_#0000001A] rounded-[16px]">
        <div>
          <h1 className="text-black font-semibold text-[25px] lg:text-[40px] leading-[120%]">
            Crea una cuenta
          </h1>
          <p className="text-black font-medium text-[14px] leading-[120%] md:text-[18px]">
            {intent === "subscribe"
              ? "Crea tu cuenta para activar el plan Personal"
              : "Completa el siguiente formulario para crear tu cuenta"}
          </p>
        </div>
        <RegistrationForm
          socialProviders={getEnabledSocialProviders()}
          intent={intent}
        />
      </div>
    </div>
  );
};

export default Page;
