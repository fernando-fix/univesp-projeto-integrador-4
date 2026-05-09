import React, { useState, useEffect } from 'react';
import './style.css';

const API_BASE = "http://localhost:3001/api";

const COLUNAS_CONFIG = [
  { id: 'fund_8', label: '8º Fund', key: 'fund_8' },
  { id: 'fund_9', label: '9º Fund', key: 'fund_9' },
  { id: 'medio_1', label: '1º Méd', key: 'medio_1' },
  { id: 'medio_2', label: '2º Méd', key: 'medio_2' },
  { id: 'medio_3', label: '3º Méd', key: 'medio_3' },
];

export default function App() {
  const [states, setStates] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [municipiosSelecionados, setMunicipiosSelecionados] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");

  const [colunasVisiveis, setColunasVisiveis] = useState({
    fund_8: true, fund_9: true, medio_1: true, medio_2: true, medio_3: true,
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");

    fetch(`${API_BASE}/estados`)
      .then(res => res.json())
      .then(data => setStates(data.map(e => ({ sigla: e.SG_UF, nome: e.NO_UF }))))
      .catch(console.error);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const carregarCidades = async (e) => {
    const uf = e.target.value;
    if (!uf) return;
    setLoading(true);

    setMunicipiosSelecionados([]); // Limpa as cidades marcadas
    setResultado(null);            // Esconde a tabela de resultados anterior
    setFiltroNome("");             // Limpa o campo de busca/filtro

    try {
      const res = await fetch(`${API_BASE}/cities-by-uf/${uf}`);
      const data = await res.json();
      setCidades(data);
      setMunicipiosSelecionados([]);
      setFiltroNome("");
    } finally {
      setLoading(false);
    }
  };

  const toggleMunicipio = (id) => {
    setMunicipiosSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const removerMunicipio = (id) => {
    setMunicipiosSelecionados(prev => prev.filter(x => x !== id));
  };

  const consultar = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (municipiosSelecionados.length > 0) {
        qs.set('municipios', municipiosSelecionados.join(','));
      }
      const res = await fetch(`${API_BASE}/relacionado/analise-detalhada?${qs.toString()}`);
      const data = await res.json();
      setResultado(data);
    } catch (err) {
      setResultado({ erro: 'Erro na consulta' });
    } finally {
      setLoading(false);
    }
  };

  const calcularTotalLinha = (row) => {
    return COLUNAS_CONFIG.reduce((acc, col) => {
      return colunasVisiveis[col.id] ? acc + (Number(row[col.key]) || 0) : acc;
    }, 0);
  };

  const totalGeralDinamico = Array.isArray(resultado)
    ? resultado.reduce((acc, row) => acc + calcularTotalLinha(row), 0)
    : 0;

  // Lista para renderizar as tags de exclusão
  const listaSelecionados = cidades.filter(c => municipiosSelecionados.includes(c.CO_MUNICIPIO));

  return (
    <div className="bg-gray-50 dark:bg-gray-800 dark:text-white min-h-screen">
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-20 p-4 border-b dark:border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className='text-xl font-bold'>Censo Escolar <span className="opacity-50">Analytics</span></h1>
          <button onClick={toggleTheme} className="p-2 border rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">{theme === "light" ? "☾" : "☀︎"}</button>
        </div>
      </header>

      <main className="p-6 container mx-auto max-w-6xl">
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm mb-6 border dark:border-gray-700">
          <div className='flex flex-col md:flex-row gap-4 mb-6'>
            <select onChange={carregarCidades} className='flex-1 p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700'>
              <option value="">Selecione o Estado...</option>
              {states.map(s => <option key={s.sigla} value={s.sigla}>{s.nome}</option>)}
            </select>
            <input
              placeholder='Buscar município...'
              className='flex-[2] p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700'
              value={filtroNome}
              onChange={e => setFiltroNome(e.target.value)}
            />
          </div>

          {cidades.length > 0 && (
            <div className='w-full border dark:border-gray-700 rounded-2xl p-4 bg-gray-50 dark:bg-gray-800 mb-6'>

              {/* RESTAURADO: LISTA DE TAGS COM BOTÃO DE EXCLUIR (X) */}
              <div className="mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Selecionados ({municipiosSelecionados.length})</span>
                <div className="flex flex-wrap gap-2">
                  {listaSelecionados.map(c => (
                    <div key={c.CO_MUNICIPIO} className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800">
                      {c.NO_MUNICIPIO}
                      <button onClick={() => removerMunicipio(c.CO_MUNICIPIO)} className="hover:text-red-500 text-sm">✕</button>
                    </div>
                  ))}
                  {listaSelecionados.length === 0 && <span className="text-xs text-gray-400 italic">Nenhum município selecionado</span>}
                </div>
              </div>

              {/* GRADE DE SELEÇÃO */}
              <div className='grid grid-cols-2 md:grid-cols-5 gap-2 max-h-40 overflow-y-auto pt-3 border-t dark:border-gray-700'>
                {cidades.filter(c => c.NO_MUNICIPIO.toLowerCase().includes(filtroNome.toLowerCase())).map(c => (
                  <button
                    key={c.CO_MUNICIPIO}
                    onClick={() => toggleMunicipio(c.CO_MUNICIPIO)}
                    className={`text-[11px] p-2 rounded-lg truncate transition-all ${municipiosSelecionados.includes(c.CO_MUNICIPIO) ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-700 border dark:border-gray-600'}`}
                  >
                    {c.NO_MUNICIPIO}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={consultar} disabled={loading || !municipiosSelecionados.length} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold disabled:opacity-50 transition-all">
            {loading ? 'Consultando...' : 'Analisar Municípios Selecionados'}
          </button>
        </section>

        {Array.isArray(resultado) && (
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col md:flex-row justify-between gap-6">
              <div>
                <h2 className="text-gray-400 text-[10px] font-bold uppercase mb-1 tracking-widest">Matrículas Totais</h2>
                <p className="text-4xl font-black text-blue-600">{(totalGeralDinamico || 0).toLocaleString('pt-BR')}</p>
              </div>

              {/* FILTROS DE COLUNA */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border dark:border-gray-700 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-3">Exibir Anos:</span>
                <div className="flex flex-wrap gap-4">
                  {COLUNAS_CONFIG.map(col => (
                    <label key={col.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={colunasVisiveis[col.id]} onChange={() => setColunasVisiveis(p => ({ ...p, [col.id]: !p[col.id] }))} className="w-4 h-4 accent-blue-600" />
                      <span className={`text-xs font-bold ${colunasVisiveis[col.id] ? 'text-blue-600' : 'text-gray-400'}`}>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="p-5">Região / UF</th>
                    {COLUNAS_CONFIG.map(col => colunasVisiveis[col.id] && <th key={col.id} className="p-5 text-center">{col.label}</th>)}
                    <th className="p-5 text-right">Total Selecionado</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {resultado.map((row, i) => (
                    <tr key={i} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/5">
                      <td className="p-5">
                        <span className='text-[10px] block text-gray-400 font-bold uppercase'>{row.regiao}</span>
                        <span className="font-bold text-sm">{row.uf}</span>
                      </td>
                      {COLUNAS_CONFIG.map(col => colunasVisiveis[col.id] && (
                        <td key={col.id} className="p-5 text-center font-mono text-sm">{(Number(row[col.key]) || 0).toLocaleString('pt-BR')}</td>
                      ))}
                      <td className="p-5 text-right font-black text-blue-600 bg-blue-50/20 dark:bg-blue-900/5">{(calcularTotalLinha(row) || 0).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}