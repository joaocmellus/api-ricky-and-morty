// Consumo da API de Rick and Morty
async function getCharacters(search = null, page=null) {
    try {
        const queryParams = {
            name: search,
            page: page,
        }

        const response = await api.characters.get('/', { params: queryParams });
        return response.data;
    } catch (error) {
        console.error('Erro na requisição: ', error.message);
        return null;
    }
}

async function getCharacter(id) {
    if (!id) return null;
    try {
        const response = await api.characters.get(`/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro na requisição: ', error.message);
    }
}

async function getEpisode(id) {
    if (!id) return null;
    try {
        const response = await api.episodes.get(`/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro na requisição: ', error.message);
    }
}

// Renderização do Layout
async function renderCard(character) {
    const status = character.status == 'Dead' ? 'Morto' : character.status == 'Alive' ? 'Vivo' : 'Desconhecido';
    const lastEpisode = await formatLastEpisode(character.episode.slice(-1)[0]);

    return `
    <div class="card" data-id="${character.id}">
        <div class="card-image">
            <img src="${character.image}" alt="Imagem do personagem: ${character.name}">
        </div>
        <div class="card-content">
            <div class="content-box">
                <h2 class="card-title">${character.name}</h2>
                <div class="status">
                    <div class="indicator ${character.status.toLowerCase()}"></div>
                    <p>${status} - ${character.species}</p>
                </div>
            </div>
            <div class="content-box">
                <h3>Última localização conhecida:</h3>
            <p>${character.location.name}</p>
            </div>
            <div class="content-box">
                <h3>Visto a última vez em:</h3>
                <p>${lastEpisode}</p>
            </div>
        </div>
    </div>`
}

async function renderCharacters(characters) {
    if (!Array.isArray(characters)) {
        console.error('Não array passado como argumento.');
        return null;
    }

    const enableDivisors = characters.length > 2;
    let count = 0;

    try {
        const html = await characters.reduce(async (htmlPromise, character) => {
            const html = await htmlPromise;

            const card = await renderCard(character);

            count++;
            if (enableDivisors && count % 2 === 0 && count !== characters.length) {
                return html + card + '\n<div class="divisor"></div>';
            }

            return html + card;
        }, Promise.resolve(''));

        return html;
    } catch (error) {
        console.error('Erro ao renderizar personagens:', error);
    }
}

async function formatLastEpisode(episodeURL) {
    const data = await getEpisode(episodeURL.split('/').slice(-1)[0]);

    return `${data.name} - ${data.episode}`;
}

// Ações
async function updateCharacters(search=null, page=null) {
    const characters = await getCharacters(search, page);
    if (!characters) {
        return null;
    }
    console.log(characters)
        
    const charactersDiv = document.querySelector('#characters');
    charactersDiv.innerHTML = await renderCharacters(characters.results);
}

updateCharacters();