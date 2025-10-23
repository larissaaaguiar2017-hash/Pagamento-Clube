import express from "express";
import cors from "cors";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔒 Variáveis de ambiente
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://www.asaas.com/api/v3";
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BREVO_SENDER;

// 🧾 Criar cobrança no ASAAS
app.post("/create-payment", async (req, res) => {
  try {
    const { name, email, cpfCnpj, value, description, paymentMethod } = req.body;

    const response = await axios.post(
      `${ASAAS_API_URL}/payments`,
      {
        customer: null,
        billingType: paymentMethod, // PIX, BOLETO ou CREDIT_CARD
        value,
        description,
        dueDate: new Date().toISOString().split("T")[0],
        customerEmail: email,
        customerName: name,
        cpfCnpj
      },
      {
        headers: {
          access_token: ASAAS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Erro ao criar pagamento:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

// 🔔 Webhook ASAAS — notificação de pagamento confirmado
app.post("/asaas-webhook", async (req, res) => {
  const event = req.body.event;
  const payment = req.body.payment;

  if (event === "PAYMENT_RECEIVED") {
    await sendBrevoEmail(payment.customerName, payment.customerEmail, payment.value);
  }

  res.sendStatus(200);
});

// ✉️ Envio de e-mail via Brevo
async function sendBrevoEmail(name, email, value) {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: BREVO_SENDER, name: "Clube 520" },
        to: [{ email }],
        subject: "Pagamento Recebido 💚",
        htmlContent: `<h2>Olá ${name}!</h2>
        <p>Recebemos seu pagamento de <strong>R$ ${value}</strong> com sucesso!</p>
        <p>Obrigado por fazer parte do Clube 520 🌿</p>`
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("Erro ao enviar e-mail Brevo:", err.response?.data || err.message);
  }
}

app.get("/", (req, res) => {
  res.send("Servidor Pagamento-Clube rodando 🌿");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor online na porta ${PORT}`));
