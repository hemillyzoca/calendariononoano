let tipoSelecionado = null;
let eventoSelecionado = null; // objeto do evento clicado (para editar/apagar)
let chaveSelecionada = null; // chave "YYYY-M-D" do dia selecionado
let diaSelecionado = null; // número do dia selecionado (apenas para exibir)
const SENHA_ADMIN = "050215"; // senha admin (mude se quiser)
let modoAdmin = false;

// ----- ELEMENTOS DO DOM -----
const inputSenha = document.getElementById("senha-admin");
const btnEntrar = document.getElementById("btn-entrar");
const cadeado = document.getElementById("cadeado");

const calendario = document.getElementById("calendario");
const mesAno = document.getElementById("mes-ano");
const btnAnterior = document.getElementById("anterior");
const btnProximo = document.getElementById("proximo");

const overlay = document.getElementById("overlay");
const btnFechar = document.getElementById("fechar-modal");
const modalTitulo = document.getElementById("modal-titulo");
const modalDia = document.getElementById("modal-dia");
const acoesAdmin = document.getElementById("acoes-admin");
const btnEditar = document.getElementById("btn-editar");
const btnApagar = document.getElementById("btn-apagar");
const botoesTipo = document.querySelectorAll(".tipo-btn");

botoesTipo.forEach((botao) => {
  botao.onclick = () => {
    botoesTipo.forEach((b) => b.classList.remove("ativo"));
    botao.classList.add("ativo");
    tipoSelecionado = botao.dataset.tipo;
  };
});


// ----- DADOS E ESTADO -----
let dataAtual = new Date();
let eventos = {}


async function carregarEventos() {
  eventos = {};

  const snapshot = await db.collection("eventos").get();
  snapshot.forEach((doc) => {
    const ev = doc.data();
    if (!eventos[ev.chave]) eventos[ev.chave] = [];
    eventos[ev.chave].push({ ...ev, id: doc.id });
  });

  renderizarCalendario();
}

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// ----- LOGIN ADMIN -----
if (btnEntrar) {
  btnEntrar.onclick = () => {
    if (inputSenha.value === SENHA_ADMIN) {
      modoAdmin = true;
      cadeado.innerText = "🔓";
      inputSenha.value = "";
      alert("Modo administrador ativado!");
      renderizarCalendario();
    } else {
      alert("Senha incorreta!");
    }
  };
}

// ----- FECHAR MODAL -----
if (btnFechar) {
  btnFechar.onclick = () => {
    fecharOverlay();
  };
}
function fecharOverlay() {
  overlay.style.display = "none";
  eventoSelecionado = null;
  chaveSelecionada = null;
  diaSelecionado = null;
}

// ----- ADICIONAR EVENTO (usamos prompt para simplicidade) -----
async function adicionarEvento(dia) {
  const nome = prompt("Nome do evento:");
  if (!nome) return;

  if (!tipoSelecionado) {
  alert("Escolha o tipo do evento");
  return;
}
const tipo = tipoSelecionado;

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  const chave = `${ano}-${mes}-${dia}`;

  await db.collection("eventos").add({
    nome,
    tipo,
    chave
  });

  carregarEventos(); // recarrega do Firebase
}
// 🔄 resetar seleção
tipoSelecionado = null;
botoesTipo.forEach((b) => b.classList.remove("ativo"));

// ----- EDITAR EVENTO -----
if (btnEditar) {
  btnEditar.onclick = async () => {
    if (!eventoSelecionado) return;

    const novoNome = prompt(
      "Editar nome do evento:",
      eventoSelecionado.nome
    );
    if (!novoNome) return;

    try {
      await db
        .collection("eventos")
        .doc(eventoSelecionado.id)
        .update({
          nome: novoNome,
        });

      fecharOverlay();
      carregarEventos(); // recarrega do Firebase
    } catch (erro) {
      alert("Erro ao editar evento");
      console.error(erro);
    }
  };
}


// ----- APAGAR EVENTO -----
if (btnApagar) {
  btnApagar.onclick = async () => {
    if (!eventoSelecionado) return;

    const confirmar = confirm("Tem certeza que deseja apagar?");
    if (!confirmar) return;

    await db.collection("eventos").doc(eventoSelecionado.id).delete();

    fecharOverlay();
    carregarEventos();
  };
}

// ----- RENDERIZAR CALENDÁRIO -----
function renderizarCalendario() {
  if (!calendario) return;
  calendario.innerHTML = "";

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  mesAno.innerText = `${meses[mes]} ${ano}`;

  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const divDia = document.createElement("div");
    divDia.className = "dia";

    const chave = `${ano}-${mes}-${dia}`;

   if (
  eventos[chave] &&
  eventos[chave].length > 0 &&
  eventos[chave][0].tipo
) {
  divDia.classList.add(eventos[chave][0].tipo);
}


    divDia.innerHTML = `<strong>${dia}</strong>`;

    // Se houver eventos naquele dia, renderiza cada um
    if (eventos[chave]) {
      eventos[chave].forEach((evento) => {
  const ev = document.createElement("div");
  ev.className = `evento ${evento.tipo}`;
  divDia.classList.add(evento.tipo);
  ev.innerText = evento.nome;


        // clicar no evento abre o modal com opções
        ev.onclick = (e) => {
          e.stopPropagation(); // evita disparar o clique do próprio dia
          eventoSelecionado = evento;
          chaveSelecionada = chave;
          diaSelecionado = dia;

          modalTitulo.innerText = evento.nome;
          modalDia.innerText = `${dia} de ${meses[mes]}`;
          overlay.style.display = "flex";

          // mostra ações apenas se for admin
          acoesAdmin.style.display = modoAdmin ? "flex" : "none";
        };

        divDia.appendChild(ev);
      });
    }

    // clicar no dia cria evento (somente admin)
    divDia.onclick = () => {
      if (!modoAdmin) {
        alert("Área restrita. Entre como administrador.");
        return;
      }
      // para criar, usamos a função de adicionar
      adicionarEvento(dia);
    };

    // opcional: duplo clique também cria (se você quiser)
    divDia.ondblclick = () => {
      if (!modoAdmin) return;
      adicionarEvento(dia);
    };

    calendario.appendChild(divDia);
  }
}

// ----- NAVEGAÇÃO DE MESES -----
if (btnAnterior) {
  btnAnterior.onclick = () => {
    dataAtual.setMonth(dataAtual.getMonth() - 1);
    renderizarCalendario();
  };
}
if (btnProximo) {
  btnProximo.onclick = () => {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    renderizarCalendario();
  };
}

// ----- INICIALIZAÇÃO -----
carregarEventos();

