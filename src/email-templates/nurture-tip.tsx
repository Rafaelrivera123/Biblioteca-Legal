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

export default function NurtureTipEmail({
  firstName = "amigo/a",
  siteUrl = "https://www.bibliotecalegalhn.com",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>3 formas de estudiar derecho más rápido</Preview>
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
                Si estás preparando un parcial o un escrito, estas tres
                herramientas suelen ahorrar más tiempo que fotocopiar:
              </Text>
              <Text className="text-gray-700 text-sm leading-relaxed">
                1. Resumen en lenguaje claro por artículo
                <br />
                2. Asistente legal sobre el código que estás leyendo
                <br />
                3. Resaltados y notas para marcar lo que entra en el examen
              </Text>
              <Button
                href={`${siteUrl}/subscriptions`}
                className="bg-[#1E2A38] text-white px-5 py-3 rounded-md text-sm font-semibold no-underline"
              >
                Ver Plan Personal
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
