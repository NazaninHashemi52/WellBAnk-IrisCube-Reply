# backend/app/core/service_catalog.py

from dataclasses import dataclass

@dataclass(frozen=True)
class ServiceCard:
    key: str
    title: str
    subtitle: str
    advisor_name: str
    advisor_role: str
    icon: str  # optional: for frontend

SERVICE_CARDS = [
    ServiceCard(
        key="accounts",
        title="Accounts & Operative Banking",
        subtitle="Current accounts, payments, multi-currency solutions",
        advisor_name="Alessandro Martini",
        advisor_role="Accounts Specialist",
        icon="bank",
    ),
    ServiceCard(
        key="cards",
        title="Cards & Payments",
        subtitle="Credit, debit, prepaid cards and payment services",
        advisor_name="Giulia Romano",
        advisor_role="Cards & Payments Specialist",
        icon="card",
    ),
    ServiceCard(
        key="loans",
        title="Loans & Credit",
        subtitle="Personal loans, mortgages, credit lines",
        advisor_name="Marco Esposito",
        advisor_role="Loans & Credit Specialist",
        icon="wallet",
    ),
    ServiceCard(
        key="investments",
        title="Investments & Wealth",
        subtitle="Investment services, advisory, wealth management",
        advisor_name="Francesca De Luca",
        advisor_role="Wealth Management Specialist",
        icon="chart",
    ),
    ServiceCard(
        key="savings",
        title="Savings & Pension",
        subtitle="Deposits, savings books, pension funds",
        advisor_name="Luca Ferretti",
        advisor_role="Savings & Pension Specialist",
        icon="piggy",
    ),
    ServiceCard(
        key="insurance",
        title="Insurance & Protection",
        subtitle="Health insurance, home insurance, policy management",
        advisor_name="Sofia Ricci",
        advisor_role="Insurance Specialist",
        icon="shield",
    ),
]

# IMPORTANT:
# You must map your product codes/types in possesso-prodotti to these domains.
# Update these sets to match YOUR CSV values.
PRODUCT_KEYWORDS = {
    "accounts": [
        "conto corrente", "current account",
        "conto di pagamento", "payment account",
    ],
    "cards": [
        "carta di debito", "debit card",
        "carta di credito", "credit card",
        "carta prepagata", "prepaid card",
    ],
    "loans": [
        "prestito", "loan",
        "mutuo", "mortgage",
        "credito", "credit",
    ],
    "investments": [
        "investimento", "investment",
        "deposito", "deposit",
        "amministrato", "managed",
        "shares",
    ],
    "savings": [
        "pensione", "pension",
        "risparmio", "savings",
    ],
}
