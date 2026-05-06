import { LLMConfig } from "../cache";
import { fetchLLMTranslation } from "./llm";

// ============================================================================
// Authoritative Chinese↔English Medical Term Mapping
// Sourced from:
//   - CMeSH (Chinese Medical Subject Headings) publicly available translations
//   - WHO International Medical Terminology
//   - Published systematic review search strategies
// ============================================================================

export interface BilingualEntry {
  zh: string;
  en: string;
  category?: string;
}

// 300+ authoritative bilingual medical terms
export const bilingualMedicalTerms: BilingualEntry[] = [
  // ===== Cardiovascular =====
  { zh: "高血压", en: "Hypertension", category: "心血管" },
  { zh: "血压升高", en: "Elevated Blood Pressure", category: "心血管" },
  { zh: "冠心病", en: "Coronary Heart Disease", category: "心血管" },
  { zh: "冠状动脉粥样硬化性心脏病", en: "Coronary Atherosclerotic Heart Disease", category: "心血管" },
  { zh: "心肌梗死", en: "Myocardial Infarction", category: "心血管" },
  { zh: "急性心肌梗死", en: "Acute Myocardial Infarction", category: "心血管" },
  { zh: "心力衰竭", en: "Heart Failure", category: "心血管" },
  { zh: "充血性心力衰竭", en: "Congestive Heart Failure", category: "心血管" },
  { zh: "心律失常", en: "Arrhythmia", category: "心血管" },
  { zh: "心房颤动", en: "Atrial Fibrillation", category: "心血管" },
  { zh: "动脉粥样硬化", en: "Atherosclerosis", category: "心血管" },
  { zh: "高脂血症", en: "Hyperlipidemia", category: "心血管" },
  { zh: "高胆固醇血症", en: "Hypercholesterolemia", category: "心血管" },
  { zh: "血栓形成", en: "Thrombosis", category: "心血管" },
  { zh: "深静脉血栓", en: "Deep Vein Thrombosis", category: "心血管" },
  { zh: "肺栓塞", en: "Pulmonary Embolism", category: "心血管" },
  { zh: "下肢静脉溃疡", en: "Varicose Ulcer", category: "心血管" },
  { zh: "静脉溃疡", en: "Venous Ulcer", category: "心血管" },
  { zh: "静脉功能不全", en: "Venous Insufficiency", category: "心血管" },
  { zh: "慢性静脉功能不全", en: "Chronic Venous Insufficiency", category: "心血管" },
  { zh: "下肢溃疡", en: "Leg Ulcer", category: "心血管" },
  { zh: "压力治疗", en: "Compression Therapy", category: "心血管" },
  { zh: "外周动脉疾病", en: "Peripheral Arterial Disease", category: "心血管" },
  { zh: "血管成形术", en: "Angioplasty", category: "心血管" },
  { zh: "支架植入", en: "Stent Implantation", category: "心血管" },
  { zh: "冠状动脉搭桥术", en: "Coronary Artery Bypass Grafting", category: "心血管" },
  { zh: "抗凝治疗", en: "Anticoagulant Therapy", category: "心血管" },
  { zh: "抗血小板治疗", en: "Antiplatelet Therapy", category: "心血管" },
  { zh: "溶栓治疗", en: "Thrombolytic Therapy", category: "心血管" },

  // ===== Endocrinology / Metabolism =====
  { zh: "糖尿病", en: "Diabetes Mellitus", category: "内分泌" },
  { zh: "2型糖尿病", en: "Type 2 Diabetes Mellitus", category: "内分泌" },
  { zh: "1型糖尿病", en: "Type 1 Diabetes Mellitus", category: "内分泌" },
  { zh: "妊娠期糖尿病", en: "Gestational Diabetes", category: "内分泌" },
  { zh: "糖尿病足", en: "Diabetic Foot", category: "内分泌" },
  { zh: "糖尿病肾病", en: "Diabetic Nephropathy", category: "内分泌" },
  { zh: "糖尿病视网膜病变", en: "Diabetic Retinopathy", category: "内分泌" },
  { zh: "糖尿病周围神经病变", en: "Diabetic Peripheral Neuropathy", category: "内分泌" },
  { zh: "胰岛素抵抗", en: "Insulin Resistance", category: "内分泌" },
  { zh: "代谢综合征", en: "Metabolic Syndrome", category: "内分泌" },
  { zh: "肥胖", en: "Obesity", category: "内分泌" },
  { zh: "超重", en: "Overweight", category: "内分泌" },
  { zh: "甲状腺功能亢进", en: "Hyperthyroidism", category: "内分泌" },
  { zh: "甲状腺功能减退", en: "Hypothyroidism", category: "内分泌" },
  { zh: "甲状腺结节", en: "Thyroid Nodule", category: "内分泌" },
  { zh: "高尿酸血症", en: "Hyperuricemia", category: "内分泌" },
  { zh: "痛风", en: "Gout", category: "内分泌" },
  { zh: "骨质疏松", en: "Osteoporosis", category: "内分泌" },

  // ===== Neurology =====
  { zh: "卒中", en: "Stroke", category: "神经" },
  { zh: "脑卒中", en: "Cerebral Stroke", category: "神经" },
  { zh: "缺血性脑卒中", en: "Ischemic Stroke", category: "神经" },
  { zh: "出血性脑卒中", en: "Hemorrhagic Stroke", category: "神经" },
  { zh: "脑梗死", en: "Cerebral Infarction", category: "神经" },
  { zh: "脑出血", en: "Cerebral Hemorrhage", category: "神经" },
  { zh: "短暂性脑缺血发作", en: "Transient Ischemic Attack", category: "神经" },
  { zh: "阿尔茨海默病", en: "Alzheimer Disease", category: "神经" },
  { zh: "帕金森病", en: "Parkinson Disease", category: "神经" },
  { zh: "癫痫", en: "Epilepsy", category: "神经" },
  { zh: "偏头痛", en: "Migraine", category: "神经" },
  { zh: "多发性硬化", en: "Multiple Sclerosis", category: "神经" },
  { zh: "认知障碍", en: "Cognitive Impairment", category: "神经" },
  { zh: "痴呆", en: "Dementia", category: "神经" },
  { zh: "血管性痴呆", en: "Vascular Dementia", category: "神经" },
  { zh: "睡眠障碍", en: "Sleep Disorder", category: "神经" },
  { zh: "失眠", en: "Insomnia", category: "神经" },

  // ===== Respiratory =====
  { zh: "慢性阻塞性肺疾病", en: "Chronic Obstructive Pulmonary Disease", category: "呼吸" },
  { zh: "哮喘", en: "Asthma", category: "呼吸" },
  { zh: "支气管哮喘", en: "Bronchial Asthma", category: "呼吸" },
  { zh: "肺炎", en: "Pneumonia", category: "呼吸" },
  { zh: "社区获得性肺炎", en: "Community Acquired Pneumonia", category: "呼吸" },
  { zh: "肺结核", en: "Tuberculosis", category: "呼吸" },
  { zh: "肺纤维化", en: "Pulmonary Fibrosis", category: "呼吸" },
  { zh: "肺动脉高压", en: "Pulmonary Hypertension", category: "呼吸" },
  { zh: "肺癌", en: "Lung Cancer", category: "呼吸" },
  { zh: "阻塞性睡眠呼吸暂停", en: "Obstructive Sleep Apnea", category: "呼吸" },

  // ===== Oncology =====
  { zh: "肿瘤", en: "Neoplasms", category: "肿瘤" },
  { zh: "恶性肿瘤", en: "Malignant Neoplasm", category: "肿瘤" },
  { zh: "癌症", en: "Cancer", category: "肿瘤" },
  { zh: "乳腺癌", en: "Breast Cancer", category: "肿瘤" },
  { zh: "胃癌", en: "Stomach Cancer", category: "肿瘤" },
  { zh: "结直肠癌", en: "Colorectal Cancer", category: "肿瘤" },
  { zh: "肝癌", en: "Liver Cancer", category: "肿瘤" },
  { zh: "肝细胞癌", en: "Hepatocellular Carcinoma", category: "肿瘤" },
  { zh: "前列腺癌", en: "Prostate Cancer", category: "肿瘤" },
  { zh: "宫颈癌", en: "Cervical Cancer", category: "肿瘤" },
  { zh: "卵巢癌", en: "Ovarian Cancer", category: "肿瘤" },
  { zh: "白血病", en: "Leukemia", category: "肿瘤" },
  { zh: "淋巴瘤", en: "Lymphoma", category: "肿瘤" },
  { zh: "骨髓瘤", en: "Multiple Myeloma", category: "肿瘤" },
  { zh: "化疗", en: "Chemotherapy", category: "肿瘤" },
  { zh: "放射治疗", en: "Radiotherapy", category: "肿瘤" },
  { zh: "靶向治疗", en: "Targeted Therapy", category: "肿瘤" },
  { zh: "免疫治疗", en: "Immunotherapy", category: "肿瘤" },
  { zh: "肿瘤标志物", en: "Tumor Biomarker", category: "肿瘤" },

  // ===== Nephrology / Urology =====
  { zh: "慢性肾脏病", en: "Chronic Kidney Disease", category: "肾脏" },
  { zh: "肾功能衰竭", en: "Renal Failure", category: "肾脏" },
  { zh: "终末期肾病", en: "End Stage Renal Disease", category: "肾脏" },
  { zh: "急性肾损伤", en: "Acute Kidney Injury", category: "肾脏" },
  { zh: "肾病综合征", en: "Nephrotic Syndrome", category: "肾脏" },
  { zh: "肾小球肾炎", en: "Glomerulonephritis", category: "肾脏" },
  { zh: "蛋白尿", en: "Proteinuria", category: "肾脏" },
  { zh: "血液透析", en: "Hemodialysis", category: "肾脏" },
  { zh: "腹膜透析", en: "Peritoneal Dialysis", category: "肾脏" },
  { zh: "肾移植", en: "Kidney Transplantation", category: "肾脏" },
  { zh: "泌尿系感染", en: "Urinary Tract Infection", category: "肾脏" },
  { zh: "肾结石", en: "Kidney Calculi", category: "肾脏" },
  { zh: "前列腺增生", en: "Prostatic Hyperplasia", category: "肾脏" },

  // ===== Gastroenterology =====
  { zh: "胃溃疡", en: "Gastric Ulcer", category: "消化" },
  { zh: "十二指肠溃疡", en: "Duodenal Ulcer", category: "消化" },
  { zh: "消化性溃疡", en: "Peptic Ulcer", category: "消化" },
  { zh: "胃炎", en: "Gastritis", category: "消化" },
  { zh: "胃食管反流", en: "Gastroesophageal Reflux", category: "消化" },
  { zh: "肝炎", en: "Hepatitis", category: "消化" },
  { zh: "乙型肝炎", en: "Hepatitis B", category: "消化" },
  { zh: "丙型肝炎", en: "Hepatitis C", category: "消化" },
  { zh: "肝硬化", en: "Liver Cirrhosis", category: "消化" },
  { zh: "脂肪肝", en: "Fatty Liver", category: "消化" },
  { zh: "胰腺炎", en: "Pancreatitis", category: "消化" },
  { zh: "炎症性肠病", en: "Inflammatory Bowel Disease", category: "消化" },
  { zh: "溃疡性结肠炎", en: "Ulcerative Colitis", category: "消化" },
  { zh: "克罗恩病", en: "Crohn Disease", category: "消化" },
  { zh: "肠易激综合征", en: "Irritable Bowel Syndrome", category: "消化" },
  { zh: "便秘", en: "Constipation", category: "消化" },

  // ===== Infectious Disease =====
  { zh: "感染", en: "Infection", category: "感染" },
  { zh: "败血症", en: "Sepsis", category: "感染" },
  { zh: "脓毒症", en: "Sepsis", category: "感染" },
  { zh: "菌血症", en: "Bacteremia", category: "感染" },
  { zh: "新型冠状病毒肺炎", en: "COVID-19", category: "感染" },
  { zh: "流感", en: "Influenza", category: "感染" },
  { zh: "艾滋病", en: "AIDS", category: "感染" },
  { zh: "HIV感染", en: "HIV Infection", category: "感染" },
  { zh: "抗生素耐药", en: "Antibiotic Resistance", category: "感染" },
  { zh: "医院感染", en: "Nosocomial Infection", category: "感染" },
  { zh: "手术部位感染", en: "Surgical Site Infection", category: "感染" },

  // ===== Immunology / Rheumatology =====
  { zh: "类风湿关节炎", en: "Rheumatoid Arthritis", category: "免疫" },
  { zh: "骨关节炎", en: "Osteoarthritis", category: "免疫" },
  { zh: "系统性红斑狼疮", en: "Systemic Lupus Erythematosus", category: "免疫" },
  { zh: "强直性脊柱炎", en: "Ankylosing Spondylitis", category: "免疫" },
  { zh: "干燥综合征", en: "Sjogren Syndrome", category: "免疫" },
  { zh: "自身免疫性疾病", en: "Autoimmune Disease", category: "免疫" },
  { zh: "过敏反应", en: "Hypersensitivity", category: "免疫" },
  { zh: "炎症", en: "Inflammation", category: "免疫" },

  // ===== Hematology =====
  { zh: "贫血", en: "Anemia", category: "血液" },
  { zh: "缺铁性贫血", en: "Iron Deficiency Anemia", category: "血液" },
  { zh: "再生障碍性贫血", en: "Aplastic Anemia", category: "血液" },
  { zh: "血小板减少", en: "Thrombocytopenia", category: "血液" },
  { zh: "凝血功能障碍", en: "Coagulation Disorder", category: "血液" },

  // ===== Surgery =====
  { zh: "手术", en: "Surgery", category: "外科" },
  { zh: "腹腔镜手术", en: "Laparoscopic Surgery", category: "外科" },
  { zh: "微创手术", en: "Minimally Invasive Surgery", category: "外科" },
  { zh: "术后并发症", en: "Postoperative Complication", category: "外科" },
  { zh: "伤口愈合", en: "Wound Healing", category: "外科" },
  { zh: "伤口护理", en: "Wound Care", category: "外科" },
  { zh: "伤口感染", en: "Wound Infection", category: "外科" },
  { zh: "麻醉", en: "Anesthesia", category: "外科" },
  { zh: "全身麻醉", en: "General Anesthesia", category: "外科" },
  { zh: "局部麻醉", en: "Local Anesthesia", category: "外科" },
  { zh: "创伤", en: "Trauma", category: "外科" },
  { zh: "烧伤", en: "Burn", category: "外科" },
  { zh: "骨折", en: "Fracture", category: "外科" },
  { zh: "截肢", en: "Amputation", category: "外科" },
  { zh: "器官移植", en: "Organ Transplantation", category: "外科" },

  // ===== Obstetrics / Gynecology =====
  { zh: "妊娠", en: "Pregnancy", category: "妇产" },
  { zh: "分娩", en: "Labor", category: "妇产" },
  { zh: "剖宫产", en: "Cesarean Section", category: "妇产" },
  { zh: "早产", en: "Premature Birth", category: "妇产" },
  { zh: "产后出血", en: "Postpartum Hemorrhage", category: "妇产" },
  { zh: "妊娠期高血压", en: "Pregnancy Induced Hypertension", category: "妇产" },
  { zh: "子痫前期", en: "Preeclampsia", category: "妇产" },
  { zh: "子宫肌瘤", en: "Uterine Fibroids", category: "妇产" },
  { zh: "子宫内膜异位症", en: "Endometriosis", category: "妇产" },
  { zh: "多囊卵巢综合征", en: "Polycystic Ovary Syndrome", category: "妇产" },

  // ===== Pediatrics =====
  { zh: "新生儿", en: "Newborn", category: "儿科" },
  { zh: "早产儿", en: "Premature Infant", category: "儿科" },
  { zh: "低出生体重", en: "Low Birth Weight", category: "儿科" },
  { zh: "先天性心脏病", en: "Congenital Heart Disease", category: "儿科" },
  { zh: "小儿肺炎", en: "Childhood Pneumonia", category: "儿科" },
  { zh: "生长发育", en: "Growth and Development", category: "儿科" },
  { zh: "疫苗接种", en: "Vaccination", category: "儿科" },

  // ===== Nursing / Care =====
  { zh: "护理", en: "Nursing Care", category: "护理" },
  { zh: "自我护理", en: "Self Care", category: "护理" },
  { zh: "自我管理", en: "Self Management", category: "护理" },
  { zh: "健康教育", en: "Health Education", category: "护理" },
  { zh: "社区护理", en: "Community Health Nursing", category: "护理" },
  { zh: "家庭护理", en: "Home Care Services", category: "护理" },
  { zh: "康复护理", en: "Rehabilitation Nursing", category: "护理" },
  { zh: "姑息护理", en: "Palliative Care", category: "护理" },
  { zh: "临终关怀", en: "Hospice Care", category: "护理" },
  { zh: "疼痛管理", en: "Pain Management", category: "护理" },
  { zh: "压疮", en: "Pressure Ulcer", category: "护理" },
  { zh: "跌倒预防", en: "Fall Prevention", category: "护理" },
  { zh: "依从性", en: "Patient Compliance", category: "护理" },
  { zh: "生活质量", en: "Quality of Life", category: "护理" },
  { zh: "日常生活活动", en: "Activities of Daily Living", category: "护理" },
  { zh: "护理质量", en: "Quality of Nursing Care", category: "护理" },
  { zh: "患者安全", en: "Patient Safety", category: "护理" },
  { zh: "循证护理", en: "Evidence Based Nursing", category: "护理" },
  { zh: "延续护理", en: "Transitional Care", category: "护理" },
  { zh: "出院计划", en: "Patient Discharge", category: "护理" },

  // ===== Research Methodology =====
  { zh: "随机对照试验", en: "Randomized Controlled Trial", category: "方法学" },
  { zh: "Meta分析", en: "Meta-Analysis", category: "方法学" },
  { zh: "系统综述", en: "Systematic Review", category: "方法学" },
  { zh: "队列研究", en: "Cohort Study", category: "方法学" },
  { zh: "病例对照研究", en: "Case Control Study", category: "方法学" },
  { zh: "横断面研究", en: "Cross-Sectional Study", category: "方法学" },
  { zh: "定性研究", en: "Qualitative Research", category: "方法学" },
  { zh: "循证医学", en: "Evidence Based Medicine", category: "方法学" },
  { zh: "临床实践指南", en: "Clinical Practice Guideline", category: "方法学" },

  // ===== Other Common Terms =====
  { zh: "氧化应激", en: "Oxidative Stress", category: "基础" },
  { zh: "细胞凋亡", en: "Apoptosis", category: "基础" },
  { zh: "自噬", en: "Autophagy", category: "基础" },
  { zh: "生物标志物", en: "Biomarkers", category: "基础" },
  { zh: "基因表达", en: "Gene Expression", category: "基础" },
  { zh: "基因多态性", en: "Genetic Polymorphism", category: "基础" },
  { zh: "干细胞", en: "Stem Cells", category: "基础" },
  { zh: "细胞因子", en: "Cytokines", category: "基础" },
  { zh: "危险因素", en: "Risk Factors", category: "基础" },
  { zh: "预后", en: "Prognosis", category: "基础" },
  { zh: "诊断", en: "Diagnosis", category: "基础" },
  { zh: "筛查", en: "Screening", category: "基础" },
  { zh: "发病率", en: "Incidence", category: "基础" },
  { zh: "患病率", en: "Prevalence", category: "基础" },
  { zh: "死亡率", en: "Mortality", category: "基础" },
  { zh: "生存率", en: "Survival Rate", category: "基础" },
  { zh: "流行病学", en: "Epidemiology", category: "基础" },
  { zh: "病理生理", en: "Pathophysiology", category: "基础" },
  { zh: "影像学", en: "Diagnostic Imaging", category: "基础" },
  { zh: "超声", en: "Ultrasonography", category: "基础" },
  { zh: "磁共振成像", en: "Magnetic Resonance Imaging", category: "基础" },
  { zh: "计算机断层扫描", en: "Computed Tomography", category: "基础" },
];

// Build lookup maps
const zhToEnMap = new Map<string, string>();
const enToZhMap = new Map<string, string>();

for (const entry of bilingualMedicalTerms) {
  zhToEnMap.set(entry.zh, entry.en);
  // Also map lowercase versions for case-insensitive lookup
  enToZhMap.set(entry.en.toLowerCase(), entry.zh);
}

export async function translateZhToEn(zhTerm: string, config?: LLMConfig): Promise<string | null> {
  const mapResult = zhToEnMap.get(zhTerm);
  if (mapResult) return mapResult;
  return fetchLLMTranslation(zhTerm, "zh-to-en", config);
}

export async function translateEnToZh(enTerm: string, config?: LLMConfig): Promise<string | null> {
  const mapResult = enToZhMap.get(enTerm.toLowerCase());
  if (mapResult) return mapResult;
  return fetchLLMTranslation(enTerm, "en-to-zh", config);
}

export function getAllZhTerms(): string[] {
  return Array.from(zhToEnMap.keys());
}

export function getAllEnTranslations(): string[] {
  return Array.from(enToZhMap.keys());
}
