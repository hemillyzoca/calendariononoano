// ================= CONFIG =================
const SENHA_ADMIN = "050215";

let modoAdmin = false;
let dataAtual = new Date();
let eventos = {};

let diaSelecionado = null;
let tipoSelecionado = null;
let eventoSelecionadoId = null;

// ================= DOM =================
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

const btnEditar = document.getElementById("btn-editar");
const btnApagar = document.getElementById("btn-apagar");
const acoesEvento = document.querySelector(".acoes-evento");

const meses = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

// ================= LOGIN =================
btnEntrar.onclick = () => {
  if (inputSenha.value === SENHA_ADMIN) {
    modoAdmin = true;
    cadeado.classList.add("aberto");
    alert("Modo administrador ativado");
  } else {
    alert("Senha incorreta");
  }
  inputSenha.value = "";
};

// ================= TIPOS =================
botoesTipo.forEach(btn => {
  btn.onclick = () => {
    botoesTipo.forEach(b => b.classList.remove("ativo"));
    btn.classList.add("ativo");
    tipoSelecionado = btn.dataset.tipo;
  };
});

// ================= POPUP =================

// SE NÃO FOR ADMIN → só visualizar
  if (!adminAtivo) {
    abrirVisualizacao(dia);
    return;
  }

  // SE FOR ADMIN → abre popup normal
  abrirPopupEdicao(dia);
});


function fecharPopup() {
  overlay.style.display = "none";
  inputNome.value = "";
  tipoSelecionado = null;
  eventoSelecionadoId = null;
  botoesTipo.forEach(b => b.classList.remove("ativo"));
  acoesEvento.style.display = "none";
  btnSalvar.innerText = "Salvar";
}

btnFechar.onclick = fecharPopup;

// ================= SALVAR =================
btnSalvar.onclick = async () => {
  if (!inputNome.value || !tipoSelecionado) {
    alert("Preencha tudo");
    return;
  }

  const chave = `${dataAtual.getFullYear()}-${dataAtual.getMonth()}-${diaSelecionado}`;

  if (eventoSelecionadoId) {
    await db.collection("eventos").doc(eventoSelecionadoId).update({
      nome: inputNome.value,
      tipo: tipoSelecionado
    });
  } else {
    await db.collection("eventos").add({
      nome: inputNome.value,
      tipo: tipoSelecionado,
      chave
    });
  }

  fecharPopup();
  carregarEventos();
};

// ================= EDITAR / APAGAR =================
btnApagar.onclick = async () => {
  if (!eventoSelecionadoId) return;
  if (!confirm("Deseja apagar este evento?")) return;

  await db.collection("eventos").doc(eventoSelecionadoId).delete();
  fecharPopup();
  carregarEventos();
};

// ================= FIREBASE =================
async function carregarEventos() {
  eventos = {};
  const snap = await db.collection("eventos").get();

  snap.forEach(doc => {
    const ev = doc.data();
    ev.id = doc.id;
    if (!eventos[ev.chave]) eventos[ev.chave] = [];
    eventos[ev.chave].push(ev);
  });

  renderizarCalendario();
}

// ================= CALENDÁRIO =================
function renderizarCalendario() {
  calendario.innerHTML = "";

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  mesAno.innerText = `${meses[mes]} ${ano}`;

  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const primeiroDia = new Date(ano, mes, 1).getDay();

  for (let i = 0; i < primeiroDia; i++) {
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
      div.classList.add(eventos[chave][0].tipo);

      eventos[chave].forEach(ev => {
        const e = document.createElement("div");
        e.className = "evento";
        e.innerText = ev.nome;

        e.onclick = (evt) => {
          evt.stopPropagation();
          if (!modoAdmin) return;

          eventoSelecionadoId = ev.id;
          inputNome.value = ev.nome;
          tipoSelecionado = ev.tipo;

          botoesTipo.forEach(b =>
            b.classList.toggle("ativo", b.dataset.tipo === ev.tipo)
          );

          acoesEvento.style.display = "flex";
          btnSalvar.innerText = "Salvar alterações";
          overlay.style.display = "flex";
        };

        div.appendChild(e);
      });
    }

    div.onclick = () => {
      if (!modoAdmin) return alert("Área restrita");
      abrirPopup(dia);
    };

    calendario.appendChild(div);
  }
}

// ================= NAVEGAÇÃO =================
btnAnterior.onclick = () => {
  dataAtual.setMonth(dataAtual.getMonth() - 1);
  carregarEventos();
};

btnProximo.onclick = () => {
  dataAtual.setMonth(dataAtual.getMonth() + 1);
  carregarEventos();
};

carregarEventos();

function abrirVisualizacao(dia) {
  const overlay = document.getElementById("overlay-view");
  const lista = document.getElementById("lista-eventos");

  lista.innerHTML = "";

  const eventos = dados[dia] || [];

  if (eventos.length === 0) {
    lista.innerHTML = "<p>Nenhum evento nesse dia.</p>";
  } else {
    eventos.forEach(ev => {
      const div = document.createElement("div");
      div.className = `evento-view ${ev.tipo}`;
      div.textContent = ev.nome;
      lista.appendChild(div);
    });
  }

  overlay.style.display = "flex";
}

document.getElementById("fechar-view").onclick = () => {
  document.getElementById("overlay-view").style.display = "none";
};
