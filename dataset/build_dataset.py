import csv
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "combined_dataset.csv")

POP = "Počet obyvatel podle pohlaví a jednotek věku k 1. 1., 1. 7. a 31. 12..json"
UNE = "Podíl nezaměstnaných osob, pracovní místa v evidenci úřadu práce (stav k 31. 12.).json"
GDP = "Regionální HDP na 1 obyvatele - běžné ceny.json"
REY = "Průměrné ceny nemovitostí - roční období .json"
RE3 = "Průměrné ceny nemovitostí - územní srovnání.json"
WAGE = "Průměrný evidenční počet zaměstnanců a průměrné hrubé měsíční mzdy z ročního zjišťování podle sekce CZ-NACE za kraje - časová řada.json"

AREA = {
    "CZ": 78871.47,
    "CZ010": 496.21,
    "CZ020": 10928.51,
    "CZ031": 10057.99,
    "CZ032": 7648.98,
    "CZ041": 3310.35,
    "CZ042": 5338.69,
    "CZ051": 3163.42,
    "CZ052": 4759.13,
    "CZ053": 4519.28,
    "CZ063": 6796.03,
    "CZ064": 7187.79,
    "CZ071": 5271.57,
    "CZ072": 3962.95,
    "CZ080": 5430.57,
}

NAME = {
    "CZ": "Czechia", "CZ010": "Prague", "CZ020": "Central Bohemian Region",
    "CZ031": "South Bohemian Region", "CZ032": "Plzen Region",
    "CZ041": "Karlovy Vary Region", "CZ042": "Usti nad Labem Region",
    "CZ051": "Liberec Region", "CZ052": "Hradec Kralove Region",
    "CZ053": "Pardubice Region", "CZ063": "Vysocina Region",
    "CZ064": "South Moravian Region", "CZ071": "Olomouc Region",
    "CZ072": "Zlin Region", "CZ080": "Moravian-Silesian Region",
}


def index(js):
    st = [1] * len(js["size"])
    for i in range(len(st) - 2, -1, -1):
        st[i] = st[i + 1] * js["size"][i + 1]
    ids = js["id"]
    return lambda **kw: sum(kw[k] * st[i] for i, k in enumerate(ids))


def interp(points, year):
    points = sorted((y, p) for y, p in points if p is not None)
    if not points or year < points[0][0] or year > points[-1][0]:
        return None
    for (y0, p0), (y1, p1) in zip(points, points[1:]):
        if y0 <= year <= y1:
            return round(p0 + (p1 - p0) * (year - y0) / (y1 - y0))
    return round(points[-1][1])


pop = json.load(open(os.path.join(HERE, POP), encoding="utf-8"))
ix = index(pop)
R = pop["dimension"]["Uz02A"]["category"]["index"]
Y = pop["dimension"]["CasRB"]["category"]["index"]
A = pop["dimension"]["VEK1C"]["category"]["index"]
S = pop["dimension"]["POHL2"]["category"]["index"]
lbl = pop["dimension"]["VEK1C"]["category"]["label"]
v = pop["value"]

age = {k: 100 if lbl[k].startswith("100") else int(lbl[k]) for k in A if k != "VEKC"}

pop_data = {}
for r in R:
    for y in Y:
        m = f = s = 0.0
        for a in age:
            mm = v[ix(IndicatorType=0, Uz02A=R[r], CasRB=Y[y], VEK1C=A[a],
                      POHL2=S["1"])] or 0.0
            ff = v[ix(IndicatorType=0, Uz02A=R[r], CasRB=Y[y], VEK1C=A[a],
                      POHL2=S["2"])] or 0.0
            m += mm
            f += ff
            s += (mm + ff) * age[a]
        pop_data[int(y), r] = (m + f, round(s / (m + f), 2) if m + f else None,
                               round(m / f, 4) if f else None)

regions = sorted(R, key=R.get)

une = json.load(open(os.path.join(HERE, UNE), encoding="utf-8"))
ix = index(une)
R = une["dimension"]["UZ023H2U"]["category"]["index"]
Y = une["dimension"]["CasR"]["category"]["index"]
I = une["dimension"]["IndicatorType"]["category"]["index"]
v = une["value"]
une_data = {(int(y), r): v[ix(CasR=Y[y], UZ023H2U=R[r], IndicatorType=I["5973DI"])]
            for r in R for y in Y}

gdp = json.load(open(os.path.join(HERE, GDP), encoding="utf-8"))
ix = index(gdp)
R = gdp["dimension"]["Uz02A"]["category"]["index"]
Y = gdp["dimension"]["CasR"]["category"]["index"]
v = gdp["value"]
gdp_data = {(int(y), r): v[ix(IndicatorType=0, Uz02A=R[r], CasR=Y[y])]
            for r in R for y in Y}

rey = json.load(open(os.path.join(HERE, REY), encoding="utf-8"))
ix = index(rey)
R = rey["dimension"]["Uz023h22"]["category"]["index"]
Y = rey["dimension"]["CasR"]["category"]["index"]
P = rey["dimension"]["REPRCENNEM"]["category"]["index"]
v = rey["value"]
price_y = {(int(y), r): v[ix(IndicatorType=0, Uz023h22=R[r],
                             REPRCENNEM=P["10602"], CasR=Y[y])]
           for r in R for y in Y}

re3 = json.load(open(os.path.join(HERE, RE3), encoding="utf-8"))
ix = index(re3)
R = re3["dimension"]["Uz02h"]["category"]["index"]
C = re3["dimension"]["CAS3R"]["category"]["index"]
I = re3["dimension"]["IndicatorType"]["category"]["index"]
P = re3["dimension"]["REPRCENNEM3"]["category"]["index"]
v = re3["value"]
price_3 = {(int(c.split("-")[0]) + 1, r): v[ix(CAS3R=C[c], Uz02h=R[r],
                                               IndicatorType=I["7432"],
                                               REPRCENNEM3=P["10602"])]
           for c in C for r in R}

w = json.load(open(os.path.join(HERE, WAGE), encoding="utf-8"))
ix = index(w)
R = w["dimension"]["Uz2"]["category"]["index"]
Y = w["dimension"]["CasR"]["category"]["index"]
N = w["dimension"]["CZNACEMZDY"]["category"]["index"]
I = w["dimension"]["IndicatorType"]["category"]["index"]
v = w["value"]
nace = sorted(N, key=N.get)

wage = {(int(y), r, n): v[ix(Uz2=R[r], IndicatorType=I["5958P"], ZJIST=0,
                             CZNACEMZDY=N[n], CasR=Y[y])]
        for r in R for y in Y for n in N}

for y in Y:
    for n in N:
        tot = wsum = 0.0
        for r in R:
            e = v[ix(Uz2=R[r], IndicatorType=I["299AQ"], ZJIST=0,
                     CZNACEMZDY=N[n], CasR=Y[y])]
            m = v[ix(Uz2=R[r], IndicatorType=I["5958P"], ZJIST=0,
                     CZNACEMZDY=N[n], CasR=Y[y])]
            if e and m:
                tot += e
                wsum += e * m
        if tot:
            wage[int(y), "CZ", n] = round(wsum / tot, 1)

cols = ["year", "region_code", "region", "area_km2", "population_total",
        "average_age", "male_female_ratio", "flat_price_czk_m2",
        "unemployment_rate_pct", "gdp_per_capita_czk"]
cols += ["wage_total" if n == "A-S" else "wage_" + n for n in nace]

rows = []
for y in range(2010, 2023):
    for r in regions:
        p = pop_data.get((y, r), (None, None, None))
        pts = [(k[0], val) for k, val in list(price_3.items()) + list(price_y.items())
               if k[1] == r]
        rows.append([y, r, NAME[r], AREA[r], p[0], p[1], p[2], interp(pts, y),
                     une_data.get((y, r)), gdp_data.get((y, r))]
                    + [wage.get((y, r, n)) for n in nace])

with open(OUT, "w", newline="", encoding="utf-8-sig") as f:
    cw = csv.writer(f, delimiter=";")
    cw.writerow(cols)
    cw.writerows(rows)

print(len(rows), " ", len(cols))
