document.addEventListener('DOMContentLoaded', () => {
    // Seleciona o botão de "Começar" pelo seu ID
    const startButton = document.getElementById('startButton');

    // Adiciona um "ouvinte de evento" de clique ao botão
    if (startButton) {
        startButton.addEventListener('click', () => {
            // Ação ao clicar no botão.
            // Aqui, você pode redirecionar para a página principal do aplicativo.
            // Substitua 'app.html' pelo caminho correto da sua página.
            window.location.href = './pages/app.html';
            
            // Ou, para um exemplo simples, apenas logar no console
            console.log("Botão 'Começar' clicado! Redirecionando para a página do app...");
        });
    }
});