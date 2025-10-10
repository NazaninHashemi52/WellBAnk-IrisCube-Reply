# 📚 Dataset Documentation

This document describes the structure and purpose of the three main datasets used in the project: **Anagrafiche**, **Possesso prodotti**, and **Transazioni**. The datasets are linked through the field `codice_cliente`.

---

## 👤 Dataset: Anagrafiche 📄anagrafiche-synthetic.csv

| Field | Description | Type | Allowed Values / Notes |
|-------|--------------|------|------------------------|
| **codice_cliente** | Unique customer identifier | String / ID | Primary key used to link the other datasets |
| **cognome** | Customer’s last name | String | — |
| **nome** | Customer’s first name | String | — |
| **sesso** | Customer’s gender | String  (`M` / `F`) | **M** = Male, **F** = Female |
| **data_nascita** | Customer’s date of birth | Date (YYYY-MM-DD) | — |
| **citta_nascita** | City of birth | String | If the customer was **born in Italy**, contains the city of birth; otherwise, contains the **foreign country of birth** |
| **provincia_nascita** | Province of birth | String (2 letters) | If the customer was **born in Italy**, contains the **vehicle registration code** of the province (e.g. “MI” for Milan); otherwise, the value is **EE** |
| **stato_nascita** | Country of birth | String (`IT` / `EE`) | **IT** = Italy, **EE** = Foreign country |
| **codice_fiscale** | Fiscal code of the customer | String | Synthetic identifier derived from name, surname, and date of birth |
| **codice_attivita** | Code of the customer’s main economic activity | String | If the customer is **not employed**, the code starts with **X** (e.g. student, unemployed, retired); otherwise, it contains **4 characters** identifying the activity described in `descrizione_attivita` |
| **descrizione_attivita** | Text description of the economic activity | String | Examples: “Shop owner”, “Bank employee”, “Retired” |
| **posizione_attivita** | Professional position or job role | String (`OPE`, `IMP`, `QUA`, `ALT`) | **OPE** = Worker · **IMP** = Employee · **QUA** = Executive/Manager · **ALT** = Other |
| **stato_civile** | Marital status | String (`CLNB`, `SPDV`, `VEDV`, `CONI`, `CONF`, `GESF`) | **CLNB** = Single · **SPDV** = Separated/Divorced · **VEDV** = Widowed · **CONI** = Married · **CONF** = Married with children · **GESF** = Single parent with children |
| **segmento_economico** | Customer’s economic segment | String (`MM`, `SB`, `AF`) | **MM** = Mass Market (private clients with assets <100K €) · **SB** = Small Business (economic operators and small enterprises) · **AF** = Affluent (private clients with assets between 100K–500K €) |

---

## 💳 Dataset: Possesso prodotti 📄possesso-prodotti-synthetic.csv

| Field | Description | Type | Allowed Values / Notes |
|-------|--------------|------|------------------------|
| **codice_cliente** | Customer identifier | String / ID | Foreign key linked to `anagrafiche.codice_cliente` |
| **codice_prodotto** | Unique product code | String | Identifies the type of banking product or service |
| **descrizione** | Text description of the product | String | Examples: “Conto corrente MyEnergy”, “Contratto servizi di investimento InvestoUniq”, ... |
| **id_rapporto** | Unique identifier of the contractual relationship | String / ID | Distinguishes multiple contracts of the same type for one customer (e.g., multiple cards or accounts) |

---

## 💰 Dataset: Transazioni 📄movimenti-synthetic.csv

| Field | Description | Type | Allowed Values / Notes |
|-------|--------------|------|------------------------|
| **id_transazione** | Unique transaction identifier | String / ID | Primary key |
| **codice_cliente** | Identifier of the customer who made the transaction | String / ID | Foreign key linked to `anagrafiche.codice_cliente` |
| **timestamp** | Transaction date and time | Datetime (ISO 8601 format: `YYYY-MM-DDTHH:MM:SS.ssssss+TZ`) | Example: `2025-07-28T16:33:13.077957+02:00` |
| **latitudine** | Geographical latitude of the transaction | Decimal (float) | Indicates the **geographical location** where the transaction occurred |
| **longitudine** | Geographical longitude of the transaction | Decimal (float) | Indicates the **geographical location** where the transaction occurred |
| **macrocategoria** | Main spending category | String | Examples: “Famiglia”, “Entrate”, “Casa” |
| **categoria** | Detailed spending category | String | Examples: “Gas & energia elettrica”, “TV, Internet, telefono”, “Trasporti, noleggi, taxi e parcheggi”, etc. |
| **importo** | Transaction amount | Decimal (float) | Positive for inflows, negative for outflows (depending on banking context) |

---

## 🔗 Relationships between datasets

- `anagrafiche.codice_cliente` ←→ `possesso_prodotti.codice_cliente`  
- `anagrafiche.codice_cliente` ←→ `transazioni.codice_cliente`
- Each **customer** can:
  - own **one or more products** (1:N relationship)
  - have **one or more transactions** (1:N relationship)
- The three datasets together enable analysis of customer segmentation and financial behavior.

---
