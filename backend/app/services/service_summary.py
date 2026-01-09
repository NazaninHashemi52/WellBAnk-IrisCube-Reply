# backend/app/services/service_summary.py

from __future__ import annotations

import csv
from dataclasses import asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Iterable, Set

from app.core.service_catalog import SERVICE_CARDS, PRODUCT_DOMAIN_MAP


UPLOADS_DIR = Path("uploads")  # your backend already uses /uploads


def _read_csv(path: Path) -> Iterable[dict]:
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row


def _pick_first_existing(row: dict, candidates: list[str]) -> str | None:
    for c in candidates:
        if c in row and row[c] not in (None, ""):
            return row[c]
    return None


def _parse_date(s: str | None) -> datetime | None:
    if not s:
        return None
    s = s.strip()
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return None


def _load_owned_products(possesso_csv: Path) -> Dict[str, Set[str]]:
    customer_col = "codice_cliente"
    description_col = "descrizione"

    domain_customers: Dict[str, Set[str]] = {c.key: set() for c in SERVICE_CARDS}

    for row in _read_csv(possesso_csv):
        cid = row.get(customer_col)
        raw_descr = row.get(description_col, "")

        if not cid or not raw_descr:
            continue

        descr = normalize_text(raw_descr)

        for domain, keywords in PRODUCT_KEYWORDS.items():
            for kw in keywords:
                if kw in descr:
                    domain_customers[domain].add(str(cid))
                    break

    return domain_customers




def _load_active_customers(movimenti_csv: Path, days: int = 90) -> Set[str]:
    """
    Active customer = at least 1 transaction in last `days`.
    """
    customer_id_cols = ["id_cliente", "customer_id", "cliente_id", "ID_CLIENTE"]
    date_cols = ["data", "date", "timestamp", "DATA"]

    cutoff = datetime.now() - timedelta(days=days)
    active: Set[str] = set()

    for row in _read_csv(movimenti_csv):
        cid = _pick_first_existing(row, customer_id_cols)
        dt = _parse_date(_pick_first_existing(row, date_cols))
        if not cid or not dt:
            continue
        if dt >= cutoff:
            active.add(cid)

    return active


def compute_services_summary() -> list[dict]:
    """
    Uses uploaded CSVs:
      - uploads/anagrafiche/anagrafiche-synthetic.csv (optional for later)
      - uploads/possesso/possesso-prodotti-synthetic.csv
      - uploads/movimenti/movimenti-synthetic.csv

    Output fits the UI cards.
    """

    # Try multiple possible paths for flexibility
    possesso_csv = (
        UPLOADS_DIR / "prodotti" / "possesso-prodotti-synthetic.csv"  # Actual location
        if (UPLOADS_DIR / "prodotti" / "possesso-prodotti-synthetic.csv").exists()
        else UPLOADS_DIR / "possesso" / "possesso-prodotti-synthetic.csv"  # Alternative
    )
    movimenti_csv = UPLOADS_DIR / "movimenti" / "movimenti-synthetic.csv"

    # If you uploaded with different names, update these paths.

    domain_customers = _load_owned_products(possesso_csv) if possesso_csv.exists() else {c.key: set() for c in SERVICE_CARDS}
    active_customers = _load_active_customers(movimenti_csv, days=90) if movimenti_csv.exists() else set()

    items = []
    for card in SERVICE_CARDS:
        customers = domain_customers.get(card.key, set())
        clients = len(customers)

        # “conversion” proxy: active ratio (0..1) within that domain
        active_in_domain = len(customers.intersection(active_customers)) if clients else 0
        conversion = (active_in_domain / clients) if clients else 0.0

        items.append(
            {
                **asdict(card),
                "clients": clients,
                "conversion_rate": round(conversion, 4),
                "conversion_pct": int(round(conversion * 100)),
            }
        )
    return items
