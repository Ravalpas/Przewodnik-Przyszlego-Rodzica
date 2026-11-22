"""Create exclusively synthetic PDFs. Never reads competition documents."""
from pathlib import Path
import fitz

out=Path(__file__).resolve().parents[1]/'dist/examples/documents'
out.mkdir(parents=True,exist_ok=True)
font=Path('C:/Windows/Fonts/arial.ttf')
def pdf(name,lines,scan=False):
    document=fitz.open();page=document.new_page();page.insert_font(fontname='Synthetic',fontfile=str(font))
    y=55
    for line in ['FIKCYJNY PRZYKŁAD APLIKACJI — NIE JEST DOKUMENTEM ZUS']+lines:
        page.insert_text((42,y),line,fontname='Synthetic',fontsize=11);y+=26
    if scan:
        pix=page.get_pixmap(matrix=fitz.Matrix(2,2));scanned=fitz.open();s=scanned.new_page();s.insert_image(s.rect,stream=pix.tobytes('png'));document.close();document=scanned
    document.save(out/(name+'.pdf'),deflate=True);document.close()
pdf('wniosek',['ZAM — syntetyczny zestaw do kontroli danych','Dane matki','Imię i nazwisko: Anna Przykładowa','Faktyczna data porodu: 01.11.2026','Liczba dzieci: 1','Data złożenia wniosku: 10.11.2026'])
pdf('podstawa',['Z-3 — syntetyczne zaświadczenie płatnika','Dane osoby ubezpieczonej','Rodzaj zatrudnienia: pracownik','Podstawa wymiaru zasiłku: 6000,00 zł','Wymiar etatu: 1'])
pdf('ubezpieczenie',['POŚWIADCZENIE UBEZPIECZENIA','Dane osoby ubezpieczonej','Rodzaj zatrudnienia: pracownik','Ubezpieczenie chorobowe: obowiązkowe','Początek ubezpieczenia chorobowego: 01.01.2024'])
pdf('decyzja',['DECYZJA — FIKCYJNY WYNIK REFERENCYJNY','Przyznano zasiłek macierzyński.','Okres referencyjny: 01.11.2026 – 20.03.2027','Kwota przyznanego świadczenia: 28000,00 zł','Wynik kontrolny: 6000 / 30 × 140 dni × 100%.','Tego wyniku nie wolno używać jako danych do wyliczenia.'])
pdf('skan',['POŚWIADCZENIE UBEZPIECZENIA','Dane matki','Imię i nazwisko: Elżbieta Żółkiewska','Rodzaj zatrudnienia: pracownik','Ubezpieczenie chorobowe: obowiązkowe','Początek ubezpieczenia chorobowego: 01.02.2024'],True)
pdf('konflikt',['ZAM','Dane matki','Faktyczna data porodu: 02.11.2026','Liczba dzieci: 1'])
pdf('brak-ubezpieczenia',['POŚWIADCZENIE UBEZPIECZENIA','Dane matki','Rodzaj zatrudnienia: uninsured','Ubezpieczenie chorobowe: brak','Faktyczna data porodu: 01.11.2026'])
# Synthetic AcroForm: unchecked boxes must never become true.
d=fitz.open();p=d.new_page();p.insert_text((40,40),'ZAM - SYNTHETIC ACROFORM')
for index,(name,value) in enumerate([('eventDate','2026-11-01'),('basis','6000.00')]):
    w=fitz.Widget();w.field_name=name;w.field_type=fitz.PDF_WIDGET_TYPE_TEXT;w.rect=fitz.Rect(40,80+index*45,250,110+index*45);w.field_value=value;p.add_widget(w)
w=fitz.Widget();w.field_name='life';w.field_type=fitz.PDF_WIDGET_TYPE_CHECKBOX;w.rect=fitz.Rect(40,200,60,220);w.field_value=False;p.add_widget(w);d.save(out/'acroform.pdf');d.close()
d=fitz.open(out/'ubezpieczenie.pdf');d.save(out/'haslo.pdf',encryption=fitz.PDF_ENCRYPT_AES_256,owner_pw='synthetic-owner',user_pw='test123');d.close()
print('Generated 9 exclusively synthetic PDF fixtures.')
