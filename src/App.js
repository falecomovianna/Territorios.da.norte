import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebase';
import {
  collection, doc, getDocs,
  addDoc, updateDoc, deleteDoc, onSnapshot
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
  const [editMode, setEditMode] = useState(false);
  const [editandoTerritorio, setEditandoTerritorio] = useState(null);
  const [nomeEditado, setNomeEditado] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'territorios'), snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        progresso: d.data().progresso ?? 0
      }));
      list.sort((a, b) => {
        const numA = parseInt(a.nome.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.nome.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      setTerritorios(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function addTerritorio() {
    if (!novoNome.trim()) return;
    await addDoc(collection(db, 'territorios'), { nome: novoNome.trim(), mapaUrl: '' });
    setNovoNome(''); setShowAdd(false);
  }

  async function salvarNomeTerritorio(t) {
    if (!nomeEditado.trim()) return;
    await updateDoc(doc(db, 'territorios', t.id), { nome: nomeEditado.trim() });
    setEditandoTerritorio(null);
  }

  async function deletarTerritorio(t) {
    if (!window.confirm(`Excluir "${t.nome}"? Todos os dados serão perdidos!`)) return;
    const quadrasSnap = await getDocs(collection(db, 'territorios', t.id, 'quadras'));
    for (const q of quadrasSnap.docs) {
      const casasSnap = await getDocs(collection(db, 'territorios', t.id, 'quadras', q.id, 'casas'));
      for (const c of casasSnap.docs) {
        await deleteDoc(doc(db, 'territorios', t.id, 'quadras', q.id, 'casas', c.id));
      }
      await deleteDoc(doc(db, 'territorios', t.id, 'quadras', q.id));
    }
    await deleteDoc(doc(db, 'territorios', t.id));
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <div className="screen">
      <div className="header">
        <div className="header-icon"><MapIcon /></div>
        <div style={{flex:1}}>
          <h1 className="header-title">Norte - Navegantes</h1>
          <p className="header-sub">Selecione um território para gerenciar</p>
        </div>
        <button className={`icon-btn ${editMode ? 'active' : ''}`} style={{marginLeft:'auto'}} onClick={() => {
          if (editMode) { setEditMode(false); setEditandoTerritorio(null); return; }
          const senha = prompt('Digite a senha para editar:');
          if (senha === '8318') { setEditMode(true); }
          else if (senha !== null) { alert('Senha incorreta!'); }
        }}>
          <PencilIcon />
        </button>
      </div>
      <div className="list">
        {territorios.map(t => (
          <div key={t.id} className="card">
            <div className="card-header-row">
              <div className="card-pin">📍</div>
              <div className="card-info" style={{flex:1}}>
                {editMode && editandoTerritorio === t.id ? (
                  <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
                    <input className="input-small" style={{flex:1, fontSize:'15px', fontWeight:'800'}}
                      value={nomeEditado}
                      onChange={e => setNomeEditado(e.target.value)}
                      onKeyDown={e => { if(e.key==='Enter') salvarNomeTerritorio(t); }}
                      autoFocus />
                    <button className="btn-tiny" onClick={() => salvarNomeTerritorio(t)}>✓</button>
                    <button className="btn-tiny ghost" onClick={() => setEditandoTerritorio(null)}>✕</button>
                  </div>
                ) : (
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <h2 className="card-title">{t.nome}</h2>
                    {editMode && (
                      <>
                        <button className="btn-lapis-quadra" onClick={() => { setEditandoTerritorio(t.id); setNomeEditado(t.nome); }}><PencilIcon /></button>
                        <button className="btn-lapis-quadra" style={{color:'#ef4444'}} onClick={() => deletarTerritorio(t)}><TrashIcon /></button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            {!editMode && (
              <div className="card-actions">
                <button className="btn-secondary" onClick={() => onSelectMapa(t)}><MapIcon /> Mapa</button>
                <button className="btn-primary" onClick={() => onSelectTerritorio(t)}><GridIcon /> Quadras</button>
              </div>
            )}
          </div>
        ))}
        {showAdd ? (
          <div className="add-form">
            <input className="input" placeholder="Nome do território (ex: N 01)"
              value={novoNome} onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTerritorio()} autoFocus />
            <div className="add-form-actions">
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="btn-primary" onClick={addTerritorio}>Criar</button>
            </div>
          </div>
        ) : (
          !editMode && <button className="btn-add" onClick={() => setShowAdd(true)}><PlusIcon /> Novo Território</button>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN 1B: MAPA ──────────────────────────────────────────────────────────
function MapaScreen({ territorio, onBack, onVerQuadras }) {
  const [fotoUrl, setFotoUrl] = useState(territorio.mapaUrl || '');
  const [editingFoto, setEditingFoto] = useState(false);
  const [inputUrl, setInputUrl] = useState(territorio.mapaUrl || '');
  const [verFoto, setVerFoto] = useState(false);

  async function salvarFoto() {
    await updateDoc(doc(db, 'territorios', territorio.id), { mapaUrl: inputUrl });
    setFotoUrl(inputUrl); setEditingFoto(false);
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><BackIcon /></button>
        <div><h2 className="topbar-title">{territorio.nome}</h2><p className="topbar-sub">Mapa do Território</p></div>
        <button className="icon-btn" onClick={() => setEditingFoto(true)}><PencilIcon /></button>
      </div>

      {editingFoto && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Link da Foto do Mapa</h3>
            <p className="modal-sub">Cole o link direto da imagem (JPG, PNG)</p>
            <input className="input" placeholder="https://..." value={inputUrl} onChange={e => setInputUrl(e.target.value)} />
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setEditingFoto(false)}>Cancelar</button>
              <button className="btn-primary" onClick={salvarFoto}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {verFoto && (
        <div className="foto-fullscreen" onClick={() => setVerFoto(false)}>
          <div className="foto-fullscreen-inner" onClick={e => e.stopPropagation()}>
            <button className="foto-fechar" onClick={() => setVerFoto(false)}>✕</button>
            <img src={fotoUrl} alt="Mapa" className="foto-zoom-img" />
          </div>
        </div>
      )}

      <div className="mapa-foto-container">
        {fotoUrl ? (
          <div className="mapa-foto-wrapper" onClick={() => setVerFoto(true)}>
            <div className="mapa-overlay-top">
              <span className="mapa-overlay-titulo">{territorio.nome}</span>
              <span className="mapa-overlay-hint">🔍 Toque para ampliar</span>
            </div>
            <img src={fotoUrl} alt="Mapa do território" className="mapa-foto-preview" />
          </div>
        ) : (
          <div className="mapa-empty">
            <MapIcon /><p>Nenhuma foto configurada</p>
            <button className="btn-primary" onClick={() => setEditingFoto(true)}>Adicionar Foto</button>
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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'territorios', territorio.id, 'quadras'), snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        casasCount: d.data().casasCount ?? 0,
        progresso: d.data().progresso ?? 0,
        visitadas: d.data().visitadas ?? 0,
        naoVisitadas: d.data().naoVisitadas ?? (d.data().casasCount ?? 0)
      }));
      list.sort((a, b) => {
        const numA = parseInt(a.nome.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.nome.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      setQuadras(list);
      setLoading(false);
    });
    return () => unsub();
  }, [territorio.id]);

  async function addQuadra() {
    if (!novoNome.trim()) return;
    await addDoc(collection(db, 'territorios', territorio.id, 'quadras'), {
      nome: novoNome.trim(), ruas: { topo: '', baixo: '', esquerda: '', direita: '' }
    });
    setNovoNome(''); setShowAdd(false);
  }

  async function salvarNomeQuadra(q) {
    if (!nomeEditado.trim()) return;
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', q.id), { nome: nomeEditado.trim() });
    setEditandoQuadra(null);
  }

  async function deletarQuadra(q) {
    if (!window.confirm(`Excluir "${q.nome}"? Todas as casas serão apagadas!`)) return;
    const casasSnap = await getDocs(collection(db, 'territorios', territorio.id, 'quadras', q.id, 'casas'));
    for (const c of casasSnap.docs) {
      await deleteDoc(doc(db, 'territorios', territorio.id, 'quadras', q.id, 'casas', c.id));
    }
    await deleteDoc(doc(db, 'territorios', territorio.id, 'quadras', q.id));
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><BackIcon /></button>
        <div>
          <h2 className="topbar-title topbar-territorio">{territorio.nome}</h2>
          <p className="topbar-sub">{quadras.length} Quadras</p>
        </div>
        <button className={`icon-btn ${editMode ? 'active' : ''}`} onClick={() => {
          if (editMode) { setEditMode(false); setEditandoQuadra(null); return; }
          const senha = prompt('Digite a senha para editar:');
          if (senha === '8318') { setEditMode(true); }
          else if (senha !== null) { alert('Senha incorreta!'); }
        }}>
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
                  <div style={{display:'flex', gap:'4px'}}>
                    <button className="btn-lapis-quadra" onClick={e => { e.stopPropagation(); setEditandoQuadra(q.id); setNomeEditado(q.nome); }}>
                      <PencilIcon />
                    </button>
                    <button className="btn-lapis-quadra" style={{color:'#ef4444'}} onClick={e => { e.stopPropagation(); deletarQuadra(q); }}>
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="quadra-contadores">
              <span className="contador-vermelho">🔴 {q.naoVisitadas}</span>
              <span className="contador-verde">🟢 {q.visitadas}</span>
            </div>
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
  const [ruas, setRuas] = useState(quadra.ruas || { topo: '', baixo: '', esquerda: '', direita: '' });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [confirmCasa, setConfirmCasa] = useState(null);
  const [showAddCasa, setShowAddCasa] = useState(null);
  const [novoCasaNum, setNovoCasaNum] = useState('');
  const [editRuas, setEditRuas] = useState(quadra.ruas || { topo: '', baixo: '', esquerda: '', direita: '' });

  useEffect(() => {
    // onSnapshot para casas — sem requisição separada para ruas
    const unsub = onSnapshot(
      collection(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas'),
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999) || String(a.numero).localeCompare(String(b.numero), 'pt', { numeric: true }));
        setCasas(list);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [territorio.id, quadra.id]);

  // useMemo: casas por lado calculadas uma vez por render
  const casasPorLadoMemo = useMemo(() => {
    const resultado = { topo: [], baixo: [], esquerda: [], direita: [] };
    for (const c of casas) {
      if (resultado[c.lado]) resultado[c.lado].push(c);
    }
    for (const lado of Object.keys(resultado)) {
      resultado[lado].sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));
    }
    return resultado;
  }, [casas]);

  async function salvarEdicao() {
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id), { ruas: editRuas });
    setRuas(editRuas); setEditMode(false);
  }

  async function addCasa(lado, posicao) {
    if (!novoCasaNum.trim()) return;
    const casasDoLado = casasPorLadoMemo[lado] || [];
    for (let i = posicao; i < casasDoLado.length; i++) {
      await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casasDoLado[i].id), { ordem: i + 1 });
    }
    await addDoc(collection(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas'), {
      numero: novoCasaNum.trim(), lado, visitada: false, atendeu: null, ordem: posicao
    });
    setNovoCasaNum(''); setShowAddCasa(null);
    const novaLista = [...casas, { numero: novoCasaNum.trim(), lado, visitada: false, atendeu: null, ordem: posicao }];
    atualizarProgresso(novaLista);
  }

  async function moverCasa(casa, direcao) {
    const doLado = [...(casasPorLadoMemo[casa.lado] || [])];
    for (let i = 0; i < doLado.length; i++) {
      if (doLado[i].ordem === undefined || doLado[i].ordem === null) {
        await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', doLado[i].id), { ordem: i });
        doLado[i] = { ...doLado[i], ordem: i };
      }
    }
    const idx = doLado.findIndex(c => c.id === casa.id);
    const novoIdx = idx + direcao;
    if (novoIdx < 0 || novoIdx >= doLado.length) return;
    const outro = doLado[novoIdx];
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casa.id), { ordem: novoIdx });
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', outro.id), { ordem: idx });
  }

  async function atualizarProgresso(lista) {
    const total = lista.length;
    const visitadas = lista.filter(c => c.visitada).length;
    const naoVisitadas = total - visitadas;
    const progresso = total > 0 ? Math.round((visitadas / total) * 100) : 0;
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id), {
      casasCount: total, progresso, visitadas, naoVisitadas
    });
  }

  async function confirmarVisita(casa, atendeu) {
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casa.id), { visitada: true, atendeu });
    setConfirmCasa(null);
    atualizarProgresso(casas.map(c => c.id === casa.id ? { ...c, visitada: true, atendeu } : c));
  }

  async function resetarCasa(casa) {
    await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casa.id), { visitada: false, atendeu: null });
    atualizarProgresso(casas.map(c => c.id === casa.id ? { ...c, visitada: false, atendeu: null } : c));
  }

  async function deletarCasa(casa) {
    await deleteDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', casa.id));
    atualizarProgresso(casas.filter(c => c.id !== casa.id));
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
    const list = casasPorLadoMemo[lado] || [];
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
          onClick={() => {
            if (editMode) { salvarEdicao(); return; }
            const senha = prompt('Digite a senha para editar:');
            if (senha === '8318') { setEditMode(true); }
            else if (senha !== null) { alert('Senha incorreta!'); }
          }}>
          {editMode ? '✓' : <PencilIcon />}
        </button>
      </div>
      {editMode && (
        <div className="barra-edit">
          <button className="btn-limpar-visitas" onClick={async () => {
            if (!window.confirm('Limpar todas as visitas desta quadra? Os números serão mantidos.')) return;
            const snap = await getDocs(collection(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas'));
            for (const d of snap.docs) {
              await updateDoc(doc(db, 'territorios', territorio.id, 'quadras', quadra.id, 'casas', d.id), { visitada: false, atendeu: null });
            }
            atualizarProgresso(casas.map(c => ({ ...c, visitada: false, atendeu: null })));
          }}>
            🔄 Limpar Visitas
          </button>
        </div>
      )}

      <div className="quadra-wrap">
        <div className="rua-label-wrap rua-topo-wrap">
          {editMode
            ? <input className="input-rua" value={editRuas.topo} onChange={e => setEditRuas({...editRuas, topo: e.target.value})} placeholder="Rua de cima" />
            : ruas.topo && <span className="rua-label">{ruas.topo.toUpperCase()}</span>}
        </div>

        <div className="quadra-linha-meio">
          <div className="rua-label-wrap rua-lado-wrap">
            {editMode
              ? <input className="input-rua vertical" value={editRuas.esquerda} onChange={e => setEditRuas({...editRuas, esquerda: e.target.value})} placeholder="Esq." />
              : ruas.esquerda && <span className="rua-label vertical">{ruas.esquerda.toUpperCase()}</span>}
          </div>

          <div className="quadra-box">
            <div className="quadra-label-bg">{quadra.nome}</div>
            {renderFileiraCasas('topo')}
            <div className="fileiras-laterais">
              {renderFileiraCasas('esquerda')}
              {renderFileiraCasas('direita')}
            </div>
            {renderFileiraCasas('baixo')}
          </div>

          <div className="rua-label-wrap rua-lado-wrap">
            {editMode
              ? <input className="input-rua vertical" value={editRuas.direita} onChange={e => setEditRuas({...editRuas, direita: e.target.value})} placeholder="Dir." />
              : ruas.direita && <span className="rua-label vertical">{ruas.direita.toUpperCase()}</span>}
          </div>
        </div>

        <div className="rua-label-wrap rua-baixo-wrap">
          {editMode
            ? <input className="input-rua" value={editRuas.baixo} onChange={e => setEditRuas({...editRuas, baixo: e.target.value})} placeholder="Rua de baixo" />
            : ruas.baixo && <span className="rua-label">{ruas.baixo.toUpperCase()}</span>}
        </div>
      </div>

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
