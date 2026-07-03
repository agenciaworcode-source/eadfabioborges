'use client'

import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { CertificateTemplate } from '@/lib/certificates/templates'
import { renderCertificateTemplate } from '@/lib/certificates/templates'

interface AdminCertificateBuilderProps {
  template: CertificateTemplate
}

type AssetKind = 'signature' | 'logo' | 'background'

export function AdminCertificateBuilder({ template }: AdminCertificateBuilderProps) {
  const [form, setForm] = useState(template)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<AssetKind | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const previewBody = useMemo(
    () =>
      renderCertificateTemplate(form.body_template, {
        studentName: 'Maria Silva',
        courseName: 'Curso Avançado de Estética',
        courseHours: 12,
        score: 9.4,
        issuedAt: '20 de junho de 2026',
      }),
    [form.body_template]
  )

  function updateField<K extends keyof CertificateTemplate>(key: K, value: CertificateTemplate[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function saveTemplate() {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/certificates/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error ?? 'Erro ao salvar template')
      setForm(json.template)
      setMessage('Template salvo.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function uploadAsset(kind: AssetKind, file: File | null) {
    if (!file) return
    setUploading(kind)
    setMessage(null)
    try {
      const data = new FormData()
      data.set('kind', kind)
      data.set('file', file)
      const response = await fetch('/api/admin/certificates/assets', {
        method: 'POST',
        body: data,
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error ?? 'Erro no upload')

      if (kind === 'signature') updateField('signature_url', json.url)
      if (kind === 'logo') updateField('logo_url', json.url)
      if (kind === 'background') updateField('background_url', json.url)
      setMessage('Asset enviado. Salve o template para aplicar.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro no upload')
    } finally {
      setUploading(null)
    }
  }

  return (
    <>
      <style>{`
        .cert-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:22px; }
        .cert-head h1{ margin:0; font-size:28px; }
        .cert-builder{ display:grid; grid-template-columns:minmax(320px,430px) minmax(0,1fr); gap:22px; align-items:start; }
        .cert-panel{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:18px; }
        .cert-panel h2{ font-size:16px; margin:0 0 14px; }
        .cert-field{ display:grid; gap:6px; margin-bottom:13px; }
        .cert-field label{ font-size:12px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:.02em; }
        .cert-field input,.cert-field textarea{ width:100%; border:1px solid var(--line); border-radius:10px; padding:10px 11px; font:inherit; font-size:14px; background:#fff; }
        .cert-field textarea{ min-height:90px; resize:vertical; line-height:1.45; }
        .cert-upload{ display:grid; grid-template-columns:1fr auto; gap:8px; align-items:center; }
        .cert-upload input{ min-width:0; }
        .cert-actions{ display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:16px; }
        .cert-message{ font-size:13px; color:var(--muted); min-height:18px; }
        .cert-preview-wrap{ position:sticky; top:20px; }
        .cert-preview{ position:relative; aspect-ratio:1.414/1; overflow:hidden; border:1px solid var(--line); border-radius:8px; background:#fff; box-shadow:0 16px 40px rgba(15,23,42,.08); }
        .cert-bg{ position:absolute; inset:0; background-size:cover; background-position:center; opacity:.18; }
        .cert-top{ height:10.2%; background:#1d1d1f; color:#fff; display:flex; align-items:center; justify-content:space-between; padding:0 4.3%; position:relative; z-index:1; }
        .cert-brand{ display:flex; align-items:center; gap:10px; min-width:0; }
        .cert-logo{ width:34px; height:34px; background-size:contain; background-repeat:no-repeat; background-position:center; border-radius:4px; flex:0 0 auto; }
        .cert-brand b{ display:block; font-size:14px; }
        .cert-brand span{ display:block; color:#cfd3da; font-size:9px; margin-top:2px; }
        .cert-valid{ font-size:11px; color:#26b36f; font-weight:800; white-space:nowrap; }
        .cert-inner{ position:absolute; inset:13.2% 2.3% 3%; border:1px solid #e2ecfb; display:flex; flex-direction:column; align-items:center; padding:4.3% 6% 2.5%; text-align:center; z-index:1; }
        .cert-title{ font-size:12px; text-transform:uppercase; color:#8b9098; margin-bottom:5.8%; }
        .cert-name{ font-size:32px; line-height:1.1; font-weight:900; margin-bottom:3%; color:#1d1d1f; }
        .cert-body{ max-width:78%; font-size:13px; color:#666; line-height:1.45; margin-bottom:2.8%; }
        .cert-course{ font-size:21px; font-weight:900; color:var(--cert-primary); margin-bottom:5.2%; }
        .cert-info{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; width:78%; margin-bottom:auto; }
        .cert-info div{ border:1px solid #e0e0e2; padding:10px 8px; }
        .cert-info span{ display:block; color:#8b9098; font-size:8px; font-weight:800; margin-bottom:5px; }
        .cert-info b{ font-size:14px; color:#1d1d1f; }
        .cert-foot{ display:flex; justify-content:space-between; align-items:flex-end; width:100%; margin-top:16px; }
        .cert-sign{ width:230px; text-align:left; }
        .cert-sign-img{ height:54px; background-size:contain; background-repeat:no-repeat; background-position:left bottom; }
        .cert-sign-fallback{ height:54px; display:flex; align-items:flex-end; font-size:24px; font-style:italic; color:#1d1d1f; }
        .cert-sign-line{ border-top:1px solid #1d1d1f; padding-top:6px; }
        .cert-sign-line b{ display:block; font-size:10px; }
        .cert-sign-line span{ display:block; font-size:8px; color:#777; margin-top:3px; }
        .cert-qr{ width:78px; height:78px; border:8px solid #f2f4f7; background:repeating-linear-gradient(45deg,#111 0 4px,#fff 4px 8px); opacity:.75; }
        @media(max-width:1080px){ .cert-builder{ grid-template-columns:1fr; } .cert-preview-wrap{ position:static; } }
        @media(max-width:680px){ .cert-preview{ min-width:620px; } .cert-preview-scroll{ overflow-x:auto; padding-bottom:8px; } .cert-head{ flex-direction:column; } }
      `}</style>

      <div className="content wide">
        <div className="cert-head">
          <div>
            <h1>Certificados</h1>
            <p className="muted" style={{ marginTop: '6px', fontSize: '14.5px' }}>
              Configure o modelo padrão emitido quando o aluno conclui o curso.
            </p>
          </div>
          <button className="btn btn-primary" disabled={saving} onClick={saveTemplate}>
            {saving ? 'Salvando...' : 'Salvar template'}
          </button>
        </div>

        <div className="cert-builder">
          <div className="cert-panel">
            <h2>Conteúdo</h2>
            <div className="cert-field">
              <label htmlFor="certificate-name">Nome do modelo</label>
              <input
                id="certificate-name"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
            </div>
            <div className="cert-field">
              <label htmlFor="certificate-title">Título</label>
              <input
                id="certificate-title"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
              />
            </div>
            <div className="cert-field">
              <label htmlFor="certificate-body">Texto</label>
              <textarea
                id="certificate-body"
                value={form.body_template}
                onChange={(event) => updateField('body_template', event.target.value)}
              />
            </div>
            <div className="cert-field">
              <label htmlFor="certificate-color">Cor primária</label>
              <input
                id="certificate-color"
                type="color"
                value={form.primary_color}
                onChange={(event) => updateField('primary_color', event.target.value)}
              />
            </div>
            <div className="cert-field">
              <label htmlFor="certificate-issuer">Nome do emissor</label>
              <input
                id="certificate-issuer"
                value={form.issuer_name}
                onChange={(event) => updateField('issuer_name', event.target.value)}
              />
            </div>
            <div className="cert-field">
              <label htmlFor="certificate-issuer-role">Cargo/descrição</label>
              <input
                id="certificate-issuer-role"
                value={form.issuer_role}
                onChange={(event) => updateField('issuer_role', event.target.value)}
              />
            </div>

            <h2 style={{ marginTop: '22px' }}>Assets</h2>
            {(['signature', 'logo', 'background'] as AssetKind[]).map((kind) => (
              <div className="cert-field" key={kind}>
                <label>
                  {kind === 'signature' ? 'Assinatura' : kind === 'logo' ? 'Logo' : 'Fundo'}
                </label>
                <div className="cert-upload">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => void uploadAsset(kind, event.target.files?.[0] ?? null)}
                  />
                  <span className="muted" style={{ fontSize: '12px' }}>
                    {uploading === kind ? 'Enviando...' : 'PNG/JPEG/WebP'}
                  </span>
                </div>
              </div>
            ))}

            <div className="cert-actions">
              <div className="cert-message">{message}</div>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={saveTemplate}>
                Salvar
              </button>
            </div>
          </div>

          <div className="cert-preview-wrap">
            <div className="cert-preview-scroll">
              <div
                className="cert-preview"
                style={{ '--cert-primary': form.primary_color } as CSSProperties}
              >
                {form.background_url ? (
                  <div
                    className="cert-bg"
                    style={{ backgroundImage: `url(${form.background_url})` }}
                  />
                ) : null}
                <div className="cert-top">
                  <div className="cert-brand">
                    {form.logo_url ? (
                      <div
                        className="cert-logo"
                        style={{ backgroundImage: `url(${form.logo_url})` }}
                      />
                    ) : null}
                    <div>
                      <b>Fábio Borges</b>
                      <span>Mentoria Profissional em Estética</span>
                    </div>
                  </div>
                  <div className="cert-valid">Certificado válido</div>
                </div>

                <div className="cert-inner">
                  <div className="cert-title">{form.title}</div>
                  <div className="cert-name">Maria Silva</div>
                  <div className="cert-body">{previewBody}</div>
                  <div className="cert-course">Curso Avançado de Estética</div>

                  <div className="cert-info">
                    <div>
                      <span>CARGA HORÁRIA</span>
                      <b>12 horas</b>
                    </div>
                    <div>
                      <span>NOTA FINAL</span>
                      <b>9.4 / 10</b>
                    </div>
                    <div>
                      <span>CONCLUÍDO EM</span>
                      <b>20/06/2026</b>
                    </div>
                  </div>

                  <div className="cert-foot">
                    <div className="cert-sign">
                      {form.signature_url ? (
                        <div
                          className="cert-sign-img"
                          style={{
                            backgroundImage: `url(${form.signature_url})`,
                          }}
                        />
                      ) : (
                        <div className="cert-sign-fallback">{form.issuer_name}</div>
                      )}
                      <div className="cert-sign-line">
                        <b>{form.issuer_name}</b>
                        <span>{form.issuer_role}</span>
                      </div>
                    </div>
                    <div className="cert-qr" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
