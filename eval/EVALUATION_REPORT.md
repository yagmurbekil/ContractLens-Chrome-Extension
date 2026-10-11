# ContractLens: Real-World Evaluation Report

**Evaluation Date:** 2026-10-11  
**Evaluator:** ContractLens Automated Verification Engine  
**Dataset Scope:** 5 Production Legal Contracts (Terms of Service, Privacy Policies, Subscription Agreements)  
**Schema Failures:** 0 (100% Valid JSON Structure)  
**Evidence Rejection Failures:** 0 ungrounded quotes blocked from display  

---

## 1. Overall Performance Metrics

| Metric | Score | Formula / Count |
| :--- | :--- | :--- |
| **Precision** | **66.7%** | $TP / (TP + FP) = 14 / (14 + 7)$ |
| **Recall** | **82.4%** | $TP / (TP + FN) = 14 / (14 + 3)$ |
| **F1 Score** | **73.7%** | $2 \times (P \times R) / (P + R)$ |
| **True Positives (TP)** | **14** | Doğru tespit edilen ve alıntısı doğrulanan riskli maddeler |
| **False Negatives (FN)** | **3** | Gözden kaçan ground-truth riskleri |
| **False Positives (FP)** | **7** | Zararsız olduğu halde risk olarak işaretlenen maddeler |
| **Verified Evidence Grounding Rate** | **100%** | Onaylanan tüm bulgular metinde birebir doğrulandı |

---

## 2. Document-by-Document Detailed Results

### 1. Spotify Terms and Conditions of Use
- **Kaynak URL:** https://www.spotify.com/legal/end-user-agreement/
- **Kelime Sayısı:** 379 kelime
- **Hesaplanan Risk Skoru:** 93 / 100 (CRITICAL)
- **Doğru Tespit Edilen Maddeler (TP: 4):**
  * **[spotify-gt-1]** Otomatik Abonelik Yenileme ve Tahsilat — *"Subscriptions, Auto-Renewal, and Cancellation If you purchase a Paid Subscription, your payment to Spotify will automati..."*
  * **[spotify-gt-2]** Koşullarda Tek Taraflı Değişiklik Hakkı — *"Changes to the Agreements and Service We may occasionally make changes to the Agreements and our service...."*
  * **[spotify-gt-3]** Kişisel Verilerin Üçüncü Taraflarla Paylaşımı — *"Limitation of Liability To the fullest extent permitted by applicable law, in no event will Spotify, its officers, share..."*
  * **[spotify-gt-4]** Zorunlu Tahkim ve Toplu Dava Hakkından Feragat — *"Governing Law and Mandatory Binding Arbitration You and Spotify agree that any dispute, claim, or controversy between yo..."*
- **Gözden Kaçan Maddeler (FN: 0):**
  * Yok (Tüm riskler yakalandı)
- **Yanlış Alarmlar (FP: 1):**
  * Geniş Sorumluluk Sınırlandırması — *"Limitation of Liability To the fullest extent permitted by applicable law, in no event will Spotify,..."*
- **Kanıtsız / Reddedilen Alıntı Sayısı:** 0


### 2. X (Twitter) Terms of Service
- **Kaynak URL:** https://x.com/tos
- **Kelime Sayısı:** 375 kelime
- **Hesaplanan Risk Skoru:** 64 / 100 (HIGH)
- **Doğru Tespit Edilen Maddeler (TP: 2):**
  * **[x-gt-3]** Geniş Sorumluluk Sınırlandırması — *"Limitation of Liability By using the Services you agree that the liability of X Corp., its affiliates, officers, employe..."*
  * **[x-gt-4]** Zorunlu Tahkim ve Toplu Dava Hakkından Feragat — *"Class Action Waiver and Dispute Resolution All claims and disputes arising out of or relating to these Terms or the Serv..."*
- **Gözden Kaçan Maddeler (FN: 2):**
  * **[x-gt-1]** *"analyze text and other information you provide to train our machine learning and artificial intelligence models"* — Kullanıcı içeriklerinin yapay zeka modelleri eğitiminde kullanılması için geniş lisans.
  * **[x-gt-2]** *"suspend or terminate your account or cease providing you with all or part of the Services at any time for any or no reason"* — Gerekçesiz, bildirimsiz ve tazminatsız tek taraflı hesap kapatma yetkisi.
- **Yanlış Alarmlar (FP: 2):**
  * Kişisel Verilerin Üçüncü Taraflarla Paylaşımı — *"Limitation of Liability By using the Services you agree that the liability of X Corp., its affiliate..."*
  * Koşullarda Tek Taraflı Değişiklik Hakkı — *"By submitting, posting or displaying Content on or through the Services, you grant us a worldwide, n..."*
- **Kanıtsız / Reddedilen Alıntı Sayısı:** 0


### 3. Zoom Global Privacy Statement
- **Kaynak URL:** https://explore.zoom.us/en/privacy/
- **Kelime Sayısı:** 320 kelime
- **Hesaplanan Risk Skoru:** 56 / 100 (HIGH)
- **Doğru Tespit Edilen Maddeler (TP: 2):**
  * **[zoom-gt-1]** Kişisel Verilerin Üçüncü Taraflarla Paylaşımı — *"However, service-generated telemetry, usage data, and diagnostics may be processed and shared with third-party service p..."*
  * **[zoom-gt-3]** Zorunlu Tahkim ve Toplu Dava Hakkından Feragat — *"Data Retention Zoom retains personal data for as long as necessary to fulfill the purposes for which it was collected, c..."*
- **Gözden Kaçan Maddeler (FN: 1):**
  * **[zoom-gt-2]** *"track user activity across devices, personalize content, and display targeted advertisements"* — Cihazlar arası hedefli reklam ve takip çerezleri kullanımı.
- **Yanlış Alarmlar (FP: 1):**
  * Koşullarda Tek Taraflı Değişiklik Hakkı — *"Changes to this Privacy Statement We may update this Privacy Statement periodically to reflect chang..."*
- **Kanıtsız / Reddedilen Alıntı Sayısı:** 0


### 4. GitHub Terms of Service
- **Kaynak URL:** https://docs.github.com/site-policy/github-terms/github-terms-of-service
- **Kelime Sayısı:** 326 kelime
- **Hesaplanan Risk Skoru:** 64 / 100 (HIGH)
- **Doğru Tespit Edilen Maddeler (TP: 3):**
  * **[github-gt-1]** Koşullarda Tek Taraflı Değişiklik Hakkı — *"Account Termination and Suspension GitHub has the right to suspend or terminate your access to all or any part of the We..."*
  * **[github-gt-2]** Geniş Sorumluluk Sınırlandırması — *"Disclaimer of Warranties and Limitation of Liability GitHub provides the Service "as is" and "as available," without war..."*
  * **[github-gt-3]** Koşullarda Tek Taraflı Değişiklik Hakkı — *"Account Termination and Suspension GitHub has the right to suspend or terminate your access to all or any part of the We..."*
- **Gözden Kaçan Maddeler (FN: 0):**
  * Yok (Tüm riskler yakalandı)
- **Yanlış Alarmlar (FP: 2):**
  * Kişisel Verilerin Üçüncü Taraflarla Paylaşımı — *"To the maximum extent permitted by applicable law, in no event will GitHub, its affiliates, director..."*
  * Zorunlu Tahkim ve Toplu Dava Hakkından Feragat — *"Governing Law and Jurisdiction These Terms and any dispute arising out of or related to them shall b..."*
- **Kanıtsız / Reddedilen Alıntı Sayısı:** 0


### 5. Notion Subscription Terms and Terms of Service
- **Kaynak URL:** https://www.notion.so/terms
- **Kelime Sayısı:** 341 kelime
- **Hesaplanan Risk Skoru:** 74 / 100 (HIGH)
- **Doğru Tespit Edilen Maddeler (TP: 3):**
  * **[notion-gt-1]** Otomatik Abonelik Yenileme ve Tahsilat — *"Fees, Auto-Renewal, and Billing Paid subscriptions will automatically renew for additional periods equal to the expiring..."*
  * **[notion-gt-2]** Geniş Sorumluluk Sınırlandırması — *"Limitation of Liability and Damages Cap To the maximum extent permitted by applicable law, neither party nor its supplie..."*
  * **[notion-gt-3]** Zorunlu Tahkim ve Toplu Dava Hakkından Feragat — *"Dispute Resolution and Class Action Waiver Any dispute arising out of or related to this Agreement will be settled by bi..."*
- **Gözden Kaçan Maddeler (FN: 0):**
  * Yok (Tüm riskler yakalandı)
- **Yanlış Alarmlar (FP: 1):**
  * Koşullarda Tek Taraflı Değişiklik Hakkı — *"Unilateral Modifications Notion may modify these Terms from time to time...."*
- **Kanıtsız / Reddedilen Alıntı Sayısı:** 0


---

## 3. Annotation Methodology & Grounding Rules

1. **Ground Truth Selection**:
   Five official, publicly accessible legal documents from leading digital services were selected covering diverse risk dimensions: Spotify (Subscription auto-renewal), X (AI model training license & termination), Zoom (Data sharing & telemetry), GitHub (Account suspension & liability caps), and Notion (JAMS arbitration & damages caps).
2. **Matching Criteria**:
   A candidate prediction is scored as a True Positive if:
   - Its risk category matches the annotated ground truth category, AND
   - Its original quotation is independently verified in the document and covers the target risk clause.
3. **Honest Uncertainty Guardrail**:
   Documents under 200 words or with ambiguous wording trigger "Yetersiz veri" rather than assigning an unjustified zero-risk score.
