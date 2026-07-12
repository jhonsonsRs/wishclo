const tabEntrar = document.getElementById("tab-entrar");
const tabCriarConta = document.getElementById("tab-criar-conta");
const formLogin = document.getElementById("form-login");
const btnSubmeter = document.getElementById("btn-submeter");
const loginErro = document.getElementById("login-erro");
const loginInfo = document.getElementById("login-info");

let modo = "entrar"; 

function mudarModo(novoModo) {
  modo = novoModo;
  loginErro.hidden = true;
  loginInfo.hidden = true;

  if (modo === "entrar") {
    tabEntrar.classList.add("login-tab--ativa");
    tabCriarConta.classList.remove("login-tab--ativa");
    btnSubmeter.textContent = "Entrar";
  } else {
    tabCriarConta.classList.add("login-tab--ativa");
    tabEntrar.classList.remove("login-tab--ativa");
    btnSubmeter.textContent = "Criar conta";
  }
}

tabEntrar.addEventListener("click", () => mudarModo("entrar"));
tabCriarConta.addEventListener("click", () => mudarModo("criar-conta"));

supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) {
    window.location.href = "index.html";
  }
});

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginErro.hidden = true;
  loginInfo.hidden = true;

  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;

  if (modo === "entrar") {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });

    if (error) {
      loginErro.textContent = "Email ou senha incorretos.";
      loginErro.hidden = false;
      return;
    }

    window.location.href = "index.html";
  } else {
    const { error } = await supabaseClient.auth.signUp({ email, password: senha });

    if (error) {
      loginErro.textContent = error.message;
      loginErro.hidden = false;
      return;
    }

    loginInfo.textContent = "Conta criada! Você já pode entrar.";
    loginInfo.hidden = false;
    mudarModo("entrar");
  }
});