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

interface Props {
  firstName?: string;
  siteUrl?: string;
}

export default function NurtureWelcomeEmail({
  firstName = "amigo/a",
  siteUrl = "https://www.bibliotecalegalhn.com",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Tu cuenta en Biblioteca Legal HN está lista</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-8 px-4 max-w-xl">
            <Section className="bg-[#1E2A38] text-white p-6 rounded-t-lg text-center">
              <Text className="text-xl font-bold m-0">Biblioteca Legal HN</Text>
            </Section>
            <Section className="bg-white border border-gray-200 border-t-0 p-6 rounded-b-lg">
              <Text className="text-lg font-semibold text-gray-800">
                Hola {firstName},
              </Text>
              <Text className="text-gray-700 text-base leading-relaxed">
                Ya puedes leer cualquier ley o código de Honduras completo y
                gratis. Para estudiar o trabajar más rápido, prueba los{" "}
                <strong>resúmenes en lenguaje claro</strong> y el{" "}
                <strong>asistente legal</strong> (tienes consultas IA de
                cortesía).
              </Text>
              <Button
                href={`${siteUrl}/collections`}
                className="bg-[#1E2A38] text-white px-5 py-3 rounded-md text-sm font-semibold no-underline"
              >
                Abrir la colección
              </Button>
              <Text className="text-gray-500 text-sm mt-6">
                Tip: abre un código que estés estudiando y toca “Resumen claro”
                en los primeros artículos.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
