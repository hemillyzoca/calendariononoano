let eventoSelecionadoId = null;

const SENHA_ADMIN = "050215";
let modoAdmin = false;

let dataAtual = new Date();
let eventos = {};

let diaSelecionado = null;
let tipoSelecionado = null;

// DOM
const calendario = document.getElementById("calendario");
const mesAno = document.getElementById("mes-ano");
const btnAnterior = document.getElementById("anterior");
const btnProximo = document.getElementById("proximo");

const overlay = document.getElementById("overlay");
const btnFechar = document.getElementById("fechar-modal");

const inputSenha = document.getElementById("senha-admin");
const btnEntrar = document.getElementById("btn-entrar");
const cadeado = document.getElementById("cadeado");

const inputNome = document.getElementById("nome-evento");
const btnSalvar = document.getElementById("salvar-evento");
const botoesTipo = document.querySelectorAll(".tipo-btn");

const meses = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

// LOGIN
btnEntrar.onclick = () => {
  if (inputSenha.value === SENHA_ADMIN) {
    modoAdmin = true;
    cadeado.classList.remove("fechado");
cadeado.classList.add("aberto");
    alert("Modo administrador ativado");
  } else {
    alert("Senha incorreta");
  }
  inputSenha.value = "";
};

// BOTÕES DE TIPO
botoesTipo.forEach(btn => {
  btn.onclick = () => {
    botoesTipo.forEach(b => b.classList.remove("ativo"));
    btn.classList.add("ativo");
    tipoSelecionado = btn.dataset.tipo;
  };
});

// FECHAR POPUP
btnFechar.onclick = () => {
  overlay.style.display = "none";
};

// SALVAR EVENTO
btnSalvar.onclick = async () => {
  const nome = inputNome.value.trim();
  if (!nome || !tipoSelecionado) {
    alert("Preencha tudo");
    return;
  }

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  const chave = `${ano}-${mes}-${diaSelecionado}`;

  await db.collection("eventos").add({
    nome,
    tipo: tipoSelecionado,
    chave
  });

  inputNome.value = "";
  tipoSelecionado = null;
  botoesTipo.forEach(b => b.classList.remove("ativo"));
  overlay.style.display = "none";

  carregarEventos();
};

// FIREBASE
async function carregarEventos() {
  eventos = {};
  const snap = await db.collection("eventos").get();
  snap.forEach(doc => {
    const ev = doc.data();
    if (!eventos[ev.chave]) eventos[ev.chave] = [];
    eventos[ev.chave].push(ev);
  });
  renderizarCalendario();
}

// CALENDÁRIO
function renderizarCalendario() {
  calendario.innerHTML = "";

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  mesAno.innerText = `${meses[mes]} ${ano}`;

  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  // dia da semana do primeiro dia do mês (0 = domingo)
const primeiroDiaSemana = new Date(ano, mes, 1).getDay();

// cria espaços vazios antes do dia 1
for (let i = 0; i < primeiroDiaSemana; i++) {
  const vazio = document.createElement("div");
  vazio.className = "dia vazio";
  calendario.appendChild(vazio);
}

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const div = document.createElement("div");
    div.className = "dia";
    div.innerHTML = `<strong>${dia}</strong>`;

    const chave = `${ano}-${mes}-${dia}`;
   if (eventos[chave]) {

  // pinta a lateral do dia com o tipo do PRIMEIRO evento
  div.classList.add(eventos[chave][0].tipo);

  eventos[chave].forEach(ev => {
    const e = document.createElement("div");
    e.className = `evento ${ev.tipo}`;
    e.innerText = ev.nome;
    div.appendChild(e);
  });
}


    div.onclick = () => {
      if (!modoAdmin) return alert("Área restrita");
      diaSelecionado = dia;
      overlay.style.display = "flex";
    };

    calendario.appendChild(div);
  }
}

// NAVEGAÇÃO
btnAnterior.onclick = () => {
  dataAtual.setMonth(dataAtual.getMonth() - 1);
  carregarEventos();
};

btnProximo.onclick = () => {
  dataAtual.setMonth(dataAtual.getMonth() + 1);
  carregarEventos();
};

carregarEventos();
