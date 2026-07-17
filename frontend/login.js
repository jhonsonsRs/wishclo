const tabEntrar = document.getElementById("tab-entrar");
const tabCriarConta = document.getElementById("tab-criar-conta");
const formLogin = document.getElementById("form-login");
const btnSubmeter = document.getElementById("btn-submeter");
const btnGoogle = document.getElementById("btn-google");
const loginErro = document.getElementById("login-erro");
const loginInfo = document.getElementById("login-info");
const campoNome = document.getElementById("campo-nome");

let modo = "entrar"; // ou "criar-conta"

function mudarModo(novoModo) {
  modo = novoModo;
  loginErro.hidden = true;
  loginInfo.hidden = true;

  if (modo === "entrar") {
    tabEntrar.classList.add("login-tab--ativa");
    tabCriarConta.classList.remove("login-tab--ativa");
    btnSubmeter.textContent = "Entrar";
    campoNome.hidden = true;
    document.getElementById("login-nome").required = false;
  } else {
    tabCriarConta.classList.add("login-tab--ativa");
    tabEntrar.classList.remove("login-tab--ativa");
    btnSubmeter.textContent = "Criar conta";
    campoNome.hidden = false;
    document.getElementById("login-nome").required = true;
  }
}

tabEntrar.addEventListener("click", () => mudarModo("entrar"));
tabCriarConta.addEventListener("click", () => mudarModo("criar-conta"));

btnGoogle.addEventListener("click", async () => {
  await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/index.html" },
  });
});

// se o usuário já estiver logado, manda direto pro dashboard
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
    const nome = document.getElementById("login-nome").value;
    const { error } = await supabaseClient.auth.signUp({
      email,
      password: senha,
      options: { data: { full_name: nome } },
    });

    if (error) {
      loginErro.textContent = error.message;
      loginErro.hidden = false;
      return;
    }

    loginInfo.textContent = "Conta criada! Confira seu email para confirmar antes de entrar.";
    loginInfo.hidden = false;
    mudarModo("entrar");
  }
});