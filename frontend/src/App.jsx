import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

const API_BASE = import.meta.env.VITE_API_BASE ? '' : '/api'; // backend reverso ou variável

function App() {
  const [series, setSeries] = useState([]);
  const [municipios, setMunicipios] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const liveRef = useRef(null);

  useEffect(() => {
    if (resultado && liveRef.current) {
      liveRef.current.textContent = `Consulta concluída. Total: ${resultado.somaConsolidada}`;
    }
  }, [resultado]);

  const toggleSerie = (s) => {
    setSeries(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const consultar = async () => {
    setLoading(true);
    setResultado(null);
    try {
      const qs = new URLSearchParams();
      if (municipios.trim()) qs.set('municipios', municipios);
      const res = await fetch(`${API_BASE}/relacionado/totais-por-uf?${qs.toString()}`);
      const data = await res.json();
      setResultado({
        series,
        somaConsolidada: data?.reduce ? data.reduce((acc, x) => acc + (x.total || 0), 0) : 0,
        detalhes: data
      });
    } catch (err) {
      setResultado({ erro: 'Falha ao consultar' });
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const baseStyle = {
    padding: 24,
    fontFamily: 'Arial, system-ui',
    lineHeight: 1.5,
    background: highContrast ? '#000' : '#fff',
    color: highContrast ? '#fff' : '#111'
  };

  return (
    <div>
      <a href="#conteudo" className="skip-link" style={{position:'absolute',left:-9999,top:'auto'}} onFocus={(e)=>{e.target.style.left='8px'; e.target.style.top='8px'}}>Pular para o conteúdo</a>
      <header role="banner" style={{padding:16, borderBottom:'1px solid #ccc'}}>
        <h1>Consolidador de Matrículas — Censo Escolar</h1>
        <button aria-pressed={highContrast} onClick={()=>setHighContrast(v=>!v)}>
          {highContrast ? 'Desativar contraste alto' : 'Ativar contraste alto'}
        </button>
      </header>

      <main id="conteudo" role="main" style={baseStyle}>
        <section aria-labelledby="selecao-series">
          <h2 id="selecao-series">Selecione as séries a consolidar</h2>
          <div role="group" aria-label="Séries do Ensino Fundamental e Médio">
            {[8, 9, 1, 2, 3].map(s => (
              <label key={s} style={{ marginRight: 12 }}>
                <input
                  type="checkbox"
                  checked={series.includes(s)}
                  onChange={() => toggleSerie(s)}
                />
                {s === 8 || s === 9 ? `${s}º Fundamental` : `${s}º Médio`}
              </label>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 16 }} aria-labelledby="entrada-municipios">
          <h2 id="entrada-municipios">Digite os municípios (separados por vírgula)</h2>
          <input
            aria-describedby="dica-municipios"
            aria-label="Campo para inserir nomes de municípios separados por vírgula"
            type="text"
            value={municipios}
            onChange={e => setMunicipios(e.target.value)}
            style={{ width: '80%', padding: 6 }}
          />
          <div id="dica-municipios">Ex.: São Roque, Votorantim, Sorocaba</div>
        </section>

        <div style={{ marginTop: 16 }}>
          <button onClick={consultar} disabled={loading}>
            {loading ? 'Consultando...' : 'Consolidar'}
          </button>
        </div>

        <div aria-live="polite" aria-atomic="true" ref={liveRef} style={{position:'absolute',left:-9999}} />

        {resultado && !resultado.erro && (
          <section style={{ marginTop: 24 }} aria-labelledby="resultado-titulo">
            <h2 id="resultado-titulo">Resultado</h2>
            <p>
              Para os municípios informados, o valor consolidado de matrículas das séries{" "}
              <b>{resultado.series.join(', ') || 'não selecionadas'}</b> é de{" "}
              <b>{resultado.somaConsolidada}</b> matriculados.
            </p>
            {Array.isArray(resultado.detalhes) && (
              <table role="table" style={{borderCollapse:'collapse', width:'100%'}}>
                <caption>Totais por UF</caption>
                <thead>
                  <tr>
                    <th style={{border:'1px solid #ccc', padding:4, textAlign:'left'}}>UF</th>
                    <th style={{border:'1px solid #ccc', padding:4, textAlign:'right'}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.detalhes.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{border:'1px solid #ccc', padding:4}}>{row.SG_UF}</td>
                      <td style={{border:'1px solid #ccc', padding:4, textAlign:'right'}}>{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {resultado?.erro && (
          <div role="alert" style={{ marginTop: 24 }}>
            Ocorreu um erro ao efetuar a consulta.
          </div>
        )}
      </main>

      <footer role="contentinfo" style={{padding:16, borderTop:'1px solid #ccc'}}>
        <p>Atende WCAG 2.2: foco visível, navegação por teclado e aria-live para resultados.</p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
export default App;