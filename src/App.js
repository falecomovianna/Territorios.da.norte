import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import './App.css';

const MapIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
);
const GridIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const HomeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

function ProgressBar({ value }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

// ─── SCREEN 1: TERRITORIES ────────────────────────────────────────────────────
function TerritoriosScreen({ onSelectTerritorio, onSelectMapa }) {
  const [territorios, setTerritorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [novoNome, setNovoNome] = useState('');

  useEffect(() => { loadTerritorios(); }, []);

  async function loadTerritorios() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'territorios'));
    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      quadrasCount: 0,
      progresso: d.data().progresso ?? 0
    }));
    list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { numeric: true }));
    setTerritorios(list);
    setLoading(false);
  }

  async function addTerritorio() {
    if (!novoNome.trim()) return;
    await addDoc(collection(db, 'territorios'), { nome: novoNome.trim(), mapaUrl: '' });
    setNovoNome(''); setShowAdd(false); loadTerritorios();
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <div className="screen">
      <div className="header">
        <div className="header-icon"><MapIcon /></div>
        <div>
          <h1 className="header-title">Territórios da congregação Norte - Navegantes</h1>
          <p className="header-sub">Selecione um território para gerenciar</p>
        </div>
      </div>
      <div className="list">
        {territorios.map(t => (
          <div key={t.id} className="card">
            <div className="card-header-row">
              <div className="card-pin">📍</div>
              <div className="card-info">
                <h2 className="card-title">{t.nome}</h2>
                <p className="card-sub">{t.quadrasCount} Quadra{t.quadrasCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="card-progress-row">
              <span className="card-progress-label">Progresso</span>
              <span className="card-progress-pct">{t.progresso}%</span>
            </div>
            <ProgressBar value={t.progresso} />
            <div className="card-actions">
              <button className="btn-secondary" onClick={() => onSelectMapa(t)}><MapIcon /> Mapa</button>
              <button className="btn-primary" onClick={() => onSelectTerritorio(t)}><GridIcon /> Quadras</button>
            </div>
          </div>
        ))}
        {showAdd ? (
          <div className="add-form">
            <input className="input" placeholder="Nome do território (ex: Território Nº 5)"
              value={novoNome} onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTerritorio()} autoFocus />
            <div className="add-form-actions">
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="btn-primary" onClick={addTerritorio}>Criar</button>
            </div>
          </div>
        ) : (
          <button className="btn-add" onClick={() => setShowAdd(true)}><PlusIcon /> Novo Território</button>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN 1B: MAPA ──────────────────────────────────────────────────────────
function MapaScreen({ territorio, onBack, onVerQuadras }) {
  const [mapaUrl, setMapaUrl] = useState('');
  const [editingUrl, setEditingUrl] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMapa() {
      setLoading(true);
      try {
        const d = await getDoc(doc(db, 'territorios', territorio.id));
        const url = d.data()?.mapaUrl || '';
        setMapaUrl(url);
        setInputUrl(url);
      } catch(e) {
        setMapaUrl('');
        setInputUrl('');
      }
      setLoading(false);
    }
    loadMapa();
  }, [territorio.id]);

  async function salvarUrl() {
    await updateDoc(doc(db, 'territorios', territorio.id), { mapaUrl: inputUrl });
    setMapaUrl(inputUrl); setEditingUrl(false);
  }

  function getEmbedUrl(url) {
    if (!url) return null;
    // Extrai o mid do link e monta o embed correto
    const midMatch = url.match(/mid=([^&]+)/);
    if (midMatch) {
      return `https://www.google.com/maps/d/embed?mid=${midMatch[1]}`;
    }
    if (url.includes('mymaps.google.com') && !url.includes('/embed'))
      return url.replace('/viewer', '/embed').replace('maps/d/viewer', 'maps/d/embed');
    return url;
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><BackIcon /></button>
        <div><h2 className="topbar-title">{territorio.nome}</h2><p className="topbar-sub">Foto do Mapa</p></div>
        <button className="icon-btn" onClick={() => setEditingUrl(true)}><PencilIcon /></button>
      </div>
      {editingUrl && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Link do Google My Maps</h3>
            <p className="modal-sub">Cole o link de incorporação do seu mapa</p>
            <input className="input" placeholder="https://www.google.com/maps/d/embed?..."
              value={inputUrl} onChange={e => setInputUrl(e.target.value)} />
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setEditingUrl(false)}>Cancelar</button>
              <button className="btn-primary" onClick={salvarUrl}>Salvar</button>
            </div>
          </div>
        </div>
      )}
      <div className="mapa-container">
        {loading ? (
          <div className="mapa-empty"><div className="spinner"/></div>
        ) : getEmbedUrl(mapaUrl) ? (
          <div className="mapa-wrapper">
            <div className="mapa-overlay-top">
              <span className="mapa-overlay-titulo">{territorio.nome}</span>
              <button className="btn-localizacao" onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(pos => {
                    const { latitude, longitude } = pos.coords;
                    const a = document.createElement('a');
                    a.href = `comgooglemaps://?q=${latitude},${longitude}`;
                    a.click();
                    setTimeout(() => {
                      window.location.href = `https://maps.google.com/?q=${latitude},${longitude}`;
                    }, 500);
                  });
                }
              }}>
                📍 Minha localização
              </button>
            </div>
            <iframe src={getEmbedUrl(mapaUrl)} title="Mapa" className="mapa-iframe" allowFullScreen />
          </div>
        ) : (
          <div className="mapa-empty">
            <MapIcon /><p>Nenhum mapa configurado</p>
            <button className="btn-primary" onClick={() => setEditingUrl(true)}>Adicionar Link</button>
          </div>
        )}
      </div>
      <button className="btn-full" onClick={onVerQuadras}>Ver Quadras para Marcar Casas</button>
    </div>
  );
}

// ─── SCREEN 2: QUADRAS ────────────────────────────────────────────────────────
function QuadrasScreen({ territorio, onSelectQuadra, onBack }) {
  const [quadras, setQuadras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editandoQuadra, setEditandoQuadra] = useState(null);
  const [nomeEditado, setNomeEditado] = useState('');

  useEffect(() => { loadQuadras(); }, []);

  async function loadQuadras() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'territorios', territorio.id, 'quadras'));
    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      casasCount: d.data().casasCount ?? 0,
      progresso: d.data().progresso ?? 0
    }));
    list.sort((a, b) => {
      const numA = parseInt(a.nome.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.nome.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
    setQuadras(list); setLoading(false);
  }

  async function addQuadra() {
    if (!novoNome.trim()) return;
    await addDoc(collection(db, 'territorios', territorio.id, 'quadras'), {
      nome: novoNome.trim(), ruas: { topo: '', baixo: '', esquerda: '', direita: '' }
    });
    setNovoNome(''); setShowAdd(false); loadQuadras();
  }

  async function salvarNomeQuadra(q) {
    if (!nomeEditado.trim()) return;
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', q.id), { nome: nomeEditado.trim() });
    setEditandoQuadra(null); loadQuadras();
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><BackIcon /></button>
        <div>
          <h2 className="topbar-title topbar-title-grande">{territorio.nome}</h2>
          <p className="topbar-sub">{quadras.length} Quadras</p>
        </div>
        <button className={`icon-btn ${editMode ? 'active' : ''}`} onClick={() => { setEditMode(!editMode); setEditandoQuadra(null); }}>
          <PencilIcon />
        </button>
      </div>
      <div className="legenda">
        <div className="legenda-item"><span className="dot vermelho"/><span>Não Atendeu / Não Visitado</span></div>
        <div className="legenda-item"><span className="dot verde"/><span>Sim (Atendeu)</span></div>
      </div>
      <div className="quadras-grid">
        {quadras.map(q => (
          <div key={q.id} className="quadra-card" onClick={() => !editMode && onSelectQuadra(q)}>
            {editMode && editandoQuadra === q.id ? (
              <div className="quadra-card-header">
                <input className="input-small" style={{width:'90px', fontSize:'15px', fontWeight:'800'}}
                  value={nomeEditado}
                  onChange={e => setNomeEditado(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter') salvarNomeQuadra(q); }}
                  onClick={e => e.stopPropagation()}
                  autoFocus />
                <button className="btn-tiny" onClick={e => { e.stopPropagation(); salvarNomeQuadra(q); }}>✓</button>
              </div>
            ) : (
              <div className="quadra-card-header">
                <h3 className="quadra-nome">{q.nome}</h3>
                {editMode && (
                  <button className="btn-lapis-quadra" onClick={e => { e.stopPropagation(); setEditandoQuadra(q.id); setNomeEditado(q.nome); }}>
                    <PencilIcon />
                  </button>
                )}
              </div>
            )}
            <p className="quadra-sub">{q.casasCount} casa{q.casasCount !== 1 ? 's' : ''}</p>
            <ProgressBar value={q.progresso} />
          </div>
        ))}
        {showAdd ? (
          <div className="add-form" style={{gridColumn:'span 2'}}>
            <input className="input" placeholder="Nome da quadra (ex: Q1)"
              value={novoNome} onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addQuadra()} autoFocus />
            <div className="add-form-actions">
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="btn-primary" onClick={addQuadra}>Criar</button>
            </div>
          </div>
        ) : (
          <button className="btn-add quadra-add" onClick={() => setShowAdd(true)}><PlusIcon /> Nova Quadra</button>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN 3: CASAS ──────────────────────────────────────────────────────────
function CasasScreen({ territorio, quadra, onBack }) {
  const [casas, setCasas] = useState([]);
  const [ruas, setRuas] = useState({ topo: '', baixo: '', esquerda: '', direita: '' });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [confirmCasa, setConfirmCasa] = useState(null);
  const [showAddCasa, setShowAddCasa] = useState(null);
  const [novoCasaNum, setNovoCasaNum] = useState('');
  const [editRuas, setEditRuas] = useState({ topo: '', baixo: '', esquerda: '', direita: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const quadraDoc = await getDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id));
    const q = quadraDoc.data();
    const r = q.ruas || { topo: '', baixo: '', esquerda: '', direita: '' };
    setRuas(r); setEditRuas(r);
    const snap = await getDocs(collection(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999) || String(a.numero).localeCompare(String(b.numero), 'pt', { numeric: true }));
    setCasas(list); setLoading(false);
  }

  async function salvarEdicao() {
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id), { ruas: editRuas });
    setRuas(editRuas); setEditMode(false);
  }

  async function addCasa(lado, posicao) {
    if (!novoCasaNum.trim()) return;
    const casasDoLado = casas.filter(c => c.lado === lado)
      .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));
    for (let i = posicao; i < casasDoLado.length; i++) {
      await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casasDoLado[i].id), { ordem: i + 1 });
    }
    await addDoc(collection(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas'), {
      numero: novoCasaNum.trim(), lado, visitada: false, atendeu: null, ordem: posicao
    });
    setNovoCasaNum(''); setShowAddCasa(null);
    loadData();
    atualizarProgresso();
  }

  async function moverCasa(casa, direcao) {
    const doLado = casas
      .filter(c => c.lado === casa.lado)
      .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));
    for (let i = 0; i < doLado.length; i++) {
      if (doLado[i].ordem === undefined || doLado[i].ordem === null) {
        await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', doLado[i].id), { ordem: i });
        doLado[i].ordem = i;
      }
    }
    const idx = doLado.findIndex(c => c.id === casa.id);
    const novoIdx = idx + direcao;
    if (novoIdx < 0 || novoIdx >= doLado.length) return;
    const outro = doLado[novoIdx];
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casa.id), { ordem: novoIdx });
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', outro.id), { ordem: idx });
    loadData();
  }

  async function atualizarProgresso() {
    const snap = await getDocs(collection(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas'));
    const total = snap.size;
    const visitadas = snap.docs.filter(c => c.data().visitada).length;
    const progresso = total > 0 ? Math.round((visitadas / total) * 100) : 0;
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id), { casasCount: total, progresso });
  }

  async function confirmarVisita(casa, atendeu) {
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casa.id), { visitada: true, atendeu });
    setConfirmCasa(null);
    loadData();
    atualizarProgresso();
  }

  async function resetarCasa(casa) {
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casa.id), { visitada: false, atendeu: null });
    loadData();
    atualizarProgresso();
  }

  async function deletarCasa(casa) {
    await deleteDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casa.id));
    loadData();
    atualizarProgresso();
  }

  function casasPorLado(lado) {
    return casas.filter(c => c.lado === lado)
      .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));
  }

  function BtnInserir({ lado, posicao }) {
    const chave = `${lado}-${posicao}`;
    const ativo = showAddCasa === chave;
    if (ativo) return (
      <div className="add-casa-inline" onClick={e => e.stopPropagation()}>
        <input className="input-small" placeholder="Nº" value={novoCasaNum}
          onChange={e => setNovoCasaNum(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCasa(lado, posicao)} autoFocus />
        <button className="btn-tiny" onClick={() => addCasa(lado, posicao)}>✓</button>
        <button className="btn-tiny ghost" onClick={() => { setShowAddCasa(null); setNovoCasaNum(''); }}>✕</button>
      </div>
    );
    return (
      <button className="btn-inserir" onClick={() => { setShowAddCasa(chave); setNovoCasaNum(''); }}>
        <PlusIcon />
      </button>
    );
  }

  function renderFileiraCasas(lado) {
    const list = casasPorLado(lado);
    return (
      <div className={`fileira fileira-${lado}`}>
        {editMode && <BtnInserir lado={lado} posicao={0} />}
        {list.map((c, idx) => (
          <React.Fragment key={c.id}>
            <div
              className={`casa ${c.visitada ? (c.atendeu ? 'verde' : 'vermelho') : 'vermelho'}`}
              onClick={() => !editMode && setConfirmCasa(c)}
            >
              {editMode && (
                <div className="casa-controles">
                  <button className="casa-mover" onClick={e => { e.stopPropagation(); moverCasa(c, -1); }}>◀</button>
                  <button className="casa-delete" onClick={e => { e.stopPropagation(); deletarCasa(c); }}><TrashIcon /></button>
                  <button className="casa-mover" onClick={e => { e.stopPropagation(); moverCasa(c, 1); }}>▶</button>
                </div>
              )}
              <span className="casa-num">{c.numero}</span>
            </div>
            {editMode && <BtnInserir lado={lado} posicao={idx + 1} />}
          </React.Fragment>
        ))}
        {list.length === 0 && !editMode && null}
      </div>
    );
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><BackIcon /></button>
        <div>
          <h2 className="topbar-title">{quadra.nome}</h2>
          <p className="topbar-sub">{territorio.nome}</p>
        </div>
        <button className={`icon-btn ${editMode ? 'active' : ''}`}
          onClick={() => editMode ? salvarEdicao() : setEditMode(true)}>
          {editMode ? '✓' : <PencilIcon />}
        </button>
      </div>

      {/* ── LAYOUT DA QUADRA ── */}
      <div className="quadra-wrap">

        {/* Rua de cima */}
        <div className="rua-label-wrap rua-topo-wrap">
          {editMode
            ? <input className="input-rua" value={editRuas.topo} onChange={e => setEditRuas({...editRuas, topo: e.target.value})} placeholder="Rua de cima" />
            : ruas.topo && <span className="rua-label">{ruas.topo.toUpperCase()}</span>}
        </div>

        {/* Linha do meio: rua esq + quadra + rua dir */}
        <div className="quadra-linha-meio">

          {/* Rua esquerda */}
          <div className="rua-label-wrap rua-lado-wrap">
            {editMode
              ? <input className="input-rua vertical" value={editRuas.esquerda} onChange={e => setEditRuas({...editRuas, esquerda: e.target.value})} placeholder="Esq." />
              : ruas.esquerda && <span className="rua-label vertical">{ruas.esquerda.toUpperCase()}</span>}
          </div>

          {/* Quadra */}
          <div className="quadra-box">
            <div className="quadra-label-bg">{quadra.nome}</div>

            {/* Casas do topo */}
            {renderFileiraCasas('topo')}

            {/* Casas esquerda e direita lado a lado */}
            <div className="fileiras-laterais">
              {renderFileiraCasas('esquerda')}
              {renderFileiraCasas('direita')}
            </div>

            {/* Casas do baixo */}
            {renderFileiraCasas('baixo')}
          </div>

          {/* Rua direita */}
          <div className="rua-label-wrap rua-lado-wrap">
            {editMode
              ? <input className="input-rua vertical" value={editRuas.direita} onChange={e => setEditRuas({...editRuas, direita: e.target.value})} placeholder="Dir." />
              : ruas.direita && <span className="rua-label vertical">{ruas.direita.toUpperCase()}</span>}
          </div>
        </div>

        {/* Rua de baixo */}
        <div className="rua-label-wrap rua-baixo-wrap">
          {editMode
            ? <input className="input-rua" value={editRuas.baixo} onChange={e => setEditRuas({...editRuas, baixo: e.target.value})} placeholder="Rua de baixo" />
            : ruas.baixo && <span className="rua-label">{ruas.baixo.toUpperCase()}</span>}
        </div>

      </div>

      {/* Modal confirmar visita */}
      {confirmCasa && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon"><HomeIcon /></div>
            <h3 className="modal-title">Confirmar Visita</h3>
            <p className="modal-casa">Casa {confirmCasa.numero} — {quadra.nome}</p>
            <p className="modal-pergunta">Alguém atendeu a campainha?</p>
            {confirmCasa.visitada && (
              <button className="btn-ghost small" onClick={() => { resetarCasa(confirmCasa); setConfirmCasa(null); }}>
                Resetar visita
              </button>
            )}
            <div className="modal-actions">
              <button className="btn-nao" onClick={() => confirmarVisita(confirmCasa, false)}>NÃO</button>
              <button className="btn-sim" onClick={() => confirmarVisita(confirmCasa, true)}>SIM</button>
            </div>
            <button className="btn-cancelar" onClick={() => setConfirmCasa(null)}>Cancelar e Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('territorios');
  const [territorioSel, setTerritorioSel] = useState(null);
  const [quadraSel, setQuadraSel] = useState(null);

  return (
    <div className="app">
      {screen === 'territorios' && (
        <TerritoriosScreen
          onSelectTerritorio={t => { setTerritorioSel(t); setScreen('quadras'); }}
          onSelectMapa={t => { setTerritorioSel(t); setScreen('mapa'); }}
        />
      )}
      {screen === 'mapa' && <MapaScreen key={territorioSel.id} territorio={territorioSel} onBack={() => setScreen('territorios')} onVerQuadras={() => setScreen('quadras')} />}
      {screen === 'quadras' && (
        <QuadrasScreen
          territorio={territorioSel}
          onSelectQuadra={q => { setQuadraSel(q); setScreen('casas'); }}
          onBack={() => setScreen('territorios')}
        />
      )}
      {screen === 'casas' && <CasasScreen territorio={territorioSel} quadra={quadraSel} onBack={() => setScreen('quadras')} />}
    </div>
  );
}
