"use client";
import { useState } from "react";
import { getAllDatabasesWithCustom } from "@/lib/db-config/storage";

export default function SettingsPage() {
  const databases = getAllDatabasesWithCustom();

  // LLM config state
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load saved config on mount
  useState(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(localStorage.getItem("llm-baseUrl") || "https://open.bigmodel.cn/api/paas/v4");
      setModel(localStorage.getItem("llm-model") || "glm-5.1");
      setApiKey(localStorage.getItem("llm-apiKey") || "");
    }
  });

  const handleTest = async () => {
    if (!apiKey.trim() || !baseUrl.trim() || !model.trim()) {
      setTestResult({ success: false, message: "请填写完整的 API Key、Base URL 和 Model" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/llm/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: `连接成功！模型回复: "${data.reply}"` });
      } else {
        setTestResult({ success: false, message: `连接失败: ${data.error}` });
      }
    } catch (e) {
      setTestResult({ success: false, message: `请求失败: ${String(e)}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem("llm-apiKey", apiKey.trim());
    localStorage.setItem("llm-baseUrl", baseUrl.trim());
    localStorage.setItem("llm-model", model.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-24">
      <h1 className="font-display text-[clamp(28px,4vw,36px)] font-semibold leading-[1.15] tracking-[-0.5px] text-ink mb-2">
        设置
      </h1>
      <p className="text-base text-muted mb-12">管理数据库配置与 LLM 连接</p>

      {/* ===== LLM Configuration ===== */}
      <section className="mb-16">
        <h2 className="section-title">LLM 模型配置</h2>
        <p className="section-sub">配置大语言模型用于同义词兜底匹配（当 PubMed MeSH 无结果时自动调用）</p>

        <div className="card space-y-5">
          <div>
            <label className="block text-[11px] font-medium tracking-[1.5px] uppercase text-muted mb-2">API Base URL</label>
            <input type="text" className="text-input w-full" placeholder="https://open.bigmodel.cn/api/paas/v4"
              value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            <p className="text-xs text-muted-soft mt-1">支持 Anthropic 协议兼容的 API 端点</p>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-[1.5px] uppercase text-muted mb-2">API Key</label>
            <input type="password" className="text-input w-full font-mono" placeholder="sk-..."
              value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            <p className="text-xs text-muted-soft mt-1">密钥仅存储在浏览器本地，不会上传至服务器</p>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-[1.5px] uppercase text-muted mb-2">Model</label>
            <input type="text" className="text-input w-full" placeholder="glm-5.1"
              value={model} onChange={(e) => setModel(e.target.value)} />
            <p className="text-xs text-muted-soft mt-1">模型名称，如 glm-5.1、claude-sonnet-4-6 等</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleTest} disabled={testing} className="btn-secondary">
              {testing ? "测试中..." : "测试连接"}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saved ? "已保存" : "保存配置"}
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-md text-sm ${
              testResult.success
                ? "bg-semantic-success/10 border border-semantic-success/30 text-semantic-success"
                : "bg-semantic-error/10 border border-semantic-error/30 text-semantic-error"
            }`}>
              {testResult.message}
            </div>
          )}
        </div>
      </section>

      {/* ===== Database Config ===== */}
      <section>
        <h2 className="section-title">数据库检索语法</h2>
        <p className="section-sub">内置数据库的检索语法规则（只读）</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {databases.map((db) => (
            <div key={db.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-semibold text-ink">{db.nameZh || db.name}</h3>
                <span className="px-3 py-1 rounded-pill text-[11px] font-medium bg-surface-card text-muted">
                  {db.language === "en" ? "English" : "中文"}
                </span>
              </div>
              <div className="space-y-2 text-[13px]">
                <div className="flex gap-2">
                  <span className="text-muted shrink-0">运算符:</span>
                  <span className="font-mono text-ink-body">AND=&quot;{db.operators.and}&quot; OR=&quot;{db.operators.or}&quot; NOT=&quot;{db.operators.not}&quot;</span>
                </div>
                <div className="flex gap-2"><span className="text-muted shrink-0">字段限定:</span><span className="font-mono text-ink-body">{db.fieldQualifier}</span></div>
                <div className="flex gap-2"><span className="text-muted shrink-0">截词符:</span><span className="font-mono text-ink-body">{db.truncation.right || "不支持"}</span></div>
                <div className="flex gap-2"><span className="text-muted shrink-0">邻近检索:</span><span className="font-mono text-ink-body">{db.proximity?.syntax || "不支持"}</span></div>
                <div className="flex gap-2"><span className="text-muted shrink-0">行号格式:</span><span className="font-mono text-ink-body">{db.lineNumberFormat}</span></div>
                {db.exportNotes && <p className="text-muted-soft text-xs mt-2 italic">{db.exportNotes}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
