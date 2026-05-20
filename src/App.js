import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc, setDoc
} from 'firebase/firestore';
import './App.css';

// ─── ICONS ────────────────────────────────────────────────────────────────────
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ value }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${value}%` }} />
      <span className="progress-label">{value}%</span>
    </div>
  );
}

// ─── SCREEN 1: TERRITORIES LIST ───────────────────────────────────────────────
function TerritoriosScreen({ onSelectTerritorio, onSelectMapa }) {
  const [territorios, setTerritorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [novoNome, setNovoNome] = useState('');

  useEffect(() => { loadTerritorios(); }, []);

  async function loadTerritorios() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'territorios'));
    const list = [];
    for (const d of snap.docs) {
      const data = { id: d.id, ...d.data() };
      // Count quadras and calculate overall progress
      const quadrasSnap = await getDocs(collection(db, 'territorios', d.id, 'quadras'));
      let totalCasas = 0, visitadas = 0;
      for (const q of quadrasSnap.docs) {
        const casasSnap = await getDocs(collection(db, 'territorios', d.id, 'quadras', q.id, 'casas'));
        totalCasas += casasSnap.size;
        visitadas += casasSnap.docs.filter(c => c.data().visitada).length;
      }
      data.quadrasCount = quadrasSnap.size;
      data.progresso = totalCasas > 0 ? Math.round((visitadas / totalCasas) * 100) : 0;
      list.push(data);
    }
    setTerritorios(list);
    setLoading(false);
  }

  async function addTerritorio() {
    if (!novoNome.trim()) return;
    await addDoc(collection(db, 'territorios'), { nome: novoNome.trim(), mapaUrl: '' });
    setNovoNome('');
    setShowAdd(false);
    loadTerritorios();
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <div className="screen">
      <div className="header">
        <div className="header-icon"><MapIcon /></div>
        <div>
          <h1 className="header-title">Meus Territórios</h1>
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
              <button className="btn-secondary" onClick={() => onSelectMapa(t)}>
                <MapIcon /> Mapa
              </button>
              <button className="btn-primary" onClick={() => onSelectTerritorio(t)}>
                <GridIcon /> Quadras
              </button>
            </div>
          </div>
        ))}

        {showAdd ? (
          <div className="add-form">
            <input
              className="input"
              placeholder="Nome do território (ex: Território Nº 5)"
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTerritorio()}
              autoFocus
            />
            <div className="add-form-actions">
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="btn-primary" onClick={addTerritorio}>Criar</button>
            </div>
          </div>
        ) : (
          <button className="btn-add" onClick={() => setShowAdd(true)}>
            <PlusIcon /> Novo Território
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN 1B: MAPA VIEW ─────────────────────────────────────────────────────
function MapaScreen({ territorio, onBack }) {
  const [mapaUrl, setMapaUrl] = useState(territorio.mapaUrl || '');
  const [editingUrl, setEditingUrl] = useState(false);
  const [inputUrl, setInputUrl] = useState(territorio.mapaUrl || '');

  async function salvarUrl() {
    await updateDoc(doc(db, 'territorios', territorio.id), { mapaUrl: inputUrl });
    setMapaUrl(inputUrl);
    setEditingUrl(false);
  }

  function getEmbedUrl(url) {
    if (!url) return null;
    if (url.includes('mymaps.google.com') && !url.includes('/embed')) {
      return url.replace('/viewer', '/embed').replace('maps/d/viewer', 'maps/d/embed');
    }
    return url;
  }

  const embedUrl = getEmbedUrl(mapaUrl);

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><BackIcon /></button>
        <div>
          <h2 className="topbar-title">{territorio.nome}</h2>
          <p className="topbar-sub">Foto do Mapa</p>
        </div>
        <button className="icon-btn" onClick={() => setEditingUrl(true)}><PencilIcon /></button>
      </div>

      {editingUrl && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Link do Google My Maps</h3>
            <p className="modal-sub">Cole o link de incorporação do seu mapa</p>
            <input
              className="input"
              placeholder="https://www.google.com/maps/d/embed?..."
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setEditingUrl(false)}>Cancelar</button>
              <button className="btn-primary" onClick={salvarUrl}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      <div className="mapa-container">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Mapa do Território"
            className="mapa-iframe"
            allowFullScreen
          />
        ) : (
          <div className="mapa-empty">
            <MapIcon />
            <p>Nenhum mapa configurado</p>
            <button className="btn-primary" onClick={() => setEditingUrl(true)}>
              Adicionar Link do Mapa
            </button>
          </div>
        )}
      </div>

      <button className="btn-full" onClick={onBack}>Ver Quadras para Marcar Casas</button>
    </div>
  );
}

// ─── SCREEN 2: QUADRAS LIST ───────────────────────────────────────────────────
function QuadrasScreen({ territorio, onSelectQuadra, onBack }) {
  const [quadras, setQuadras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [novoNome, setNovoNome] = useState('');

  useEffect(() => { loadQuadras(); }, []);

  async function loadQuadras() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'territorios', territorio.id, 'quadras'));
    const list = [];
    for (const d of snap.docs) {
      const data = { id: d.id, ...d.data() };
      const casasSnap = await getDocs(collection(db, 'territorios', territorio.id, 'quadras', d.id, 'casas'));
      const total = casasSnap.size;
      const visitadas = casasSnap.docs.filter(c => c.data().visitada).length;
      data.casasCount = total;
      data.progresso = total > 0 ? Math.round((visitadas / total) * 100) : 0;
      list.push(data);
    }
    // Sort by name
    list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { numeric: true }));
    setQuadras(list);
    setLoading(false);
  }

  async function addQuadra() {
    if (!novoNome.trim()) return;
    await addDoc(collection(db, 'territorios', territorio.id, 'quadras'), {
      nome: novoNome.trim(),
      ruas: { topo: '', baixo: '', esquerda: '', direita: '' }
    });
    setNovoNome('');
    setShowAdd(false);
    loadQuadras();
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><BackIcon /></button>
        <div>
          <h2 className="topbar-title">{territorio.nome}</h2>
          <p className="topbar-sub">{quadras.length} Quadra{quadras.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="legenda">
        <div className="legenda-item"><span className="dot vermelho"/><span>Não Atendeu / Não Visitado</span></div>
        <div className="legenda-item"><span className="dot verde"/><span>Sim (Atendeu)</span></div>
      </div>

      <div className="quadras-grid">
        {quadras.map(q => (
          <div key={q.id} className="quadra-card" onClick={() => onSelectQuadra(q)}>
            <h3 className="quadra-nome">{q.nome}</h3>
            <p className="quadra-sub">{q.casasCount} casa{q.casasCount !== 1 ? 's' : ''}</p>
            <ProgressBar value={q.progresso} />
          </div>
        ))}

        {showAdd ? (
          <div className="add-form">
            <input
              className="input"
              placeholder="Nome da quadra (ex: Q1)"
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addQuadra()}
              autoFocus
            />
            <div className="add-form-actions">
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="btn-primary" onClick={addQuadra}>Criar</button>
            </div>
          </div>
        ) : (
          <button className="btn-add quadra-add" onClick={() => setShowAdd(true)}>
            <PlusIcon /> Nova Quadra
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN 3: CASAS (inside a quadra) ────────────────────────────────────────
function CasasScreen({ territorio, quadra, onBack }) {
  const [casas, setCasas] = useState([]);
  const [ruas, setRuas] = useState({ topo: '', baixo: '', esquerda: '', direita: '' });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [confirmCasa, setConfirmCasa] = useState(null);
  const [showAddCasa, setShowAddCasa] = useState(null); // 'topo'|'baixo'|'esquerda'|'direita'
  const [novoCasaNum, setNovoCasaNum] = useState('');
  const [editRuas, setEditRuas] = useState({ topo: '', baixo: '', esquerda: '', direita: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const quadraDoc = await getDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id));
    const q = quadraDoc.data();
    const r = q.ruas || { topo: '', baixo: '', esquerda: '', direita: '' };
    setRuas(r);
    setEditRuas(r);

    const snap = await getDocs(collection(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => String(a.numero).localeCompare(String(b.numero), 'pt', { numeric: true }));
    setCasas(list);
    setLoading(false);
  }

  async function salvarEdicao() {
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id), { ruas: editRuas });
    setRuas(editRuas);
    setEditMode(false);
  }

  async function addCasa(lado) {
    if (!novoCasaNum.trim()) return;
    await addDoc(collection(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas'), {
      numero: novoCasaNum.trim(),
      lado,
      visitada: false,
      atendeu: null
    });
    setNovoCasaNum('');
    setShowAddCasa(null);
    loadData();
  }

  async function confirmarVisita(casa, atendeu) {
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casa.id), {
      visitada: true,
      atendeu
    });
    setConfirmCasa(null);
    loadData();
  }

  async function resetarCasa(casa) {
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casa.id), {
      visitada: false,
      atendeu: null
    });
    loadData();
  }

  async function deletarCasa(casa) {
    await deleteDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casa.id));
    loadData();
  }

  function casasPorLado(lado) {
    return casas.filter(c => c.lado === lado);
  }

  function renderCasas(lado) {
    const list = casasPorLado(lado);
    return (
      <div className={`casas-lado casas-${lado}`}>
        {list.map(c => (
          <div
            key={c.id}
            className={`casa ${c.visitada ? (c.atendeu ? 'verde' : 'vermelho') : 'vermelho'}`}
            onClick={() => !editMode && setConfirmCasa(c)}
          >
            {editMode && (
              <button className="casa-delete" onClick={e => { e.stopPropagation(); deletarCasa(c); }}>
                <TrashIcon />
              </button>
            )}
            <span className="casa-num">{c.numero}</span>
          </div>
        ))}
        {editMode && (
          showAddCasa === lado ? (
            <div className="add-casa-inline" onClick={e => e.stopPropagation()}>
              <input
                className="input-small"
                placeholder="Nº"
                value={novoCasaNum}
                onChange={e => setNovoCasaNum(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCasa(lado)}
                autoFocus
              />
              <button className="btn-tiny" onClick={() => addCasa(lado)}>✓</button>
              <button className="btn-tiny ghost" onClick={() => { setShowAddCasa(null); setNovoCasaNum(''); }}>✕</button>
            </div>
          ) : (
            <button className="casa add-casa-btn" onClick={() => { setShowAddCasa(lado); setNovoCasaNum(''); }}>
              <PlusIcon />
            </button>
          )
        )}
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
        <button className={`icon-btn ${editMode ? 'active' : ''}`} onClick={() => editMode ? salvarEdicao() : setEditMode(true)}>
          {editMode ? '✓' : <PencilIcon />}
        </button>
      </div>

      {/* Mapa da Quadra */}
      <div className="quadra-mapa">
        {/* Rua de cima */}
        <div className="rua rua-topo">
          {editMode ? (
            <input className="input-rua" value={editRuas.topo} onChange={e => setEditRuas({ ...editRuas, topo: e.target.value })} placeholder="Rua de cima" />
          ) : ruas.topo ? <span className="rua-label">{ruas.topo.toUpperCase()}</span> : null}
        </div>

        <div className="quadra-meio">
          {/* Rua da esquerda */}
          <div className="rua rua-esquerda">
            {editMode ? (
              <input className="input-rua vertical" value={editRuas.esquerda} onChange={e => setEditRuas({ ...editRuas, esquerda: e.target.value })} placeholder="Rua esq." />
            ) : ruas.esquerda ? <span className="rua-label vertical">{ruas.esquerda.toUpperCase()}</span> : null}
          </div>

          {/* Quadra interior */}
          <div className="quadra-interior">
            <div className="quadra-label">{quadra.nome}</div>
            {renderCasas('topo')}
            {renderCasas('baixo')}
            {renderCasas('esquerda')}
            {renderCasas('direita')}
          </div>

          {/* Rua da direita */}
          <div className="rua rua-direita">
            {editMode ? (
              <input className="input-rua vertical" value={editRuas.direita} onChange={e => setEditRuas({ ...editRuas, direita: e.target.value })} placeholder="Rua dir." />
            ) : ruas.direita ? <span className="rua-label vertical">{ruas.direita.toUpperCase()}</span> : null}
          </div>
        </div>

        {/* Rua de baixo */}
        <div className="rua rua-baixo">
          {editMode ? (
            <input className="input-rua" value={editRuas.baixo} onChange={e => setEditRuas({ ...editRuas, baixo: e.target.value })} placeholder="Rua de baixo" />
          ) : ruas.baixo ? <span className="rua-label">{ruas.baixo.toUpperCase()}</span> : null}
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
      {screen === 'mapa' && (
        <MapaScreen
          territorio={territorioSel}
          onBack={() => setScreen('territorios')}
        />
      )}
      {screen === 'quadras' && (
        <QuadrasScreen
          territorio={territorioSel}
          onSelectQuadra={q => { setQuadraSel(q); setScreen('casas'); }}
          onBack={() => setScreen('territorios')}
        />
      )}
      {screen === 'casas' && (
        <CasasScreen
          territorio={territorioSel}
          quadra={quadraSel}
          onBack={() => setScreen('quadras')}
        />
      )}
    </div>
  );
}
