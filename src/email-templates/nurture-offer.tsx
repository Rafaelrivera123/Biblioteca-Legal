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

export default function NurtureOfferEmail({
  firstName = "amigo/a",
  siteUrl = "https://www.bibliotecalegalhn.com",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        Plan Personal desde $5.99/mes — o anual a mitad de precio
      </Preview>
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
                El texto de las leyes sigue gratis. El Plan Personal desbloquea
                IA, notas y lectura sin anuncios —{" "}
                <strong>$5.99/mes (L158.74)</strong>, o el plan anual a{" "}
                <strong>$35.94/año (L952.41)</strong> — la mitad de lo que
                costarían 12 meses mensuales.
              </Text>
              <Button
                href={`${siteUrl}/subscriptions`}
                className="bg-[#1E2A38] text-white px-5 py-3 rounded-md text-sm font-semibold no-underline"
              >
                Activar Plan Personal
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
