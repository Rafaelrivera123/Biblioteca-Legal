import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface EmailVerificationProps {
  username?: string;
  verificationUrl?: string;
}

const baseUrl = process.env.AUTH_URL
  ? process.env.AUTH_URL.startsWith("http")
    ? process.env.AUTH_URL.replace(/\/$/, "")
    : `https://${process.env.AUTH_URL.replace(/\/$/, "")}`
  : process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";

export const EmailVerification = ({
  username = "Simón",
  verificationUrl = `${baseUrl}/verify-email`,
}: EmailVerificationProps) => (
  <Tailwind
    config={{
      theme: {
        extend: {
          colors: {
            brand: "#007291",
          },
        },
      },
    }}
  >
    <Html>
      <Head />
      <Body style={main}>
        <Preview>
          Verifica tu correo electrónico para completar tu registro
        </Preview>
        <Container style={container}>
          <Text className="text-center text-[28px] font-semibold">
            Verifica tu correo electrónico
          </Text>
          <Text className="text-center text-[16px] font-semibold">
            Bienvenido a Biblioteca Legal
          </Text>

          <Section style={section}>
            <Text style={text}>
              ¡Hola <strong>{username}</strong>!
            </Text>
            <Text style={text}>
              Gracias por registrarte. Para completar tu registro, por favor
              verifica tu dirección de correo electrónico haciendo clic en el
              botón de abajo.
            </Text>

            <Button
              href={verificationUrl}
              style={button}
              className="mt-5 bg-blue-500"
            >
              Verificar correo electrónico
            </Button>
          </Section>

          <Text style={footer}>
            Si no solicitaste esta cuenta, puedes ignorar este correo con
            seguridad.
          </Text>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

EmailVerification.PreviewProps = {
  username: "juanperez",
  verificationUrl: "https://example.com/verify-email",
} as EmailVerificationProps;

export default EmailVerification;

const main = {
  backgroundColor: "#ffffff",
  color: "#24292e",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

const container = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "20px 0 48px",
};

const section = {
  padding: "24px",
  paddingLeft: "20px",
  border: "solid 1px #dedede",
  borderRadius: "5px",
  textAlign: "center" as const,
};

const text = {
  margin: "0 0 10px 0",
  textAlign: "left" as const,
};

const button = {
  fontSize: "14px",
  color: "#fff",
  lineHeight: 1.5,
  borderRadius: "0.5em",
  padding: "12px 24px",
};

const footer = {
  color: "#6a737d",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "60px",
};
