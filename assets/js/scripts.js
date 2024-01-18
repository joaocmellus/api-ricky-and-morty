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

function renderRadio(id) {
    return `
    <li data-id="${id}">
        <div class="box"">
            <label class="custom-radio" role="radio">
                <input type="radio" name="page" value="${id-1}" class="page-input" ${id-1 == pagination.currentIndex ? 'checked' : ''}>
                <span tabindex="0" class="selector"></span>
            </label>
            <a class="page-link" data-id="${id}" href="${renderURLQueryParams(id)}">${id}</a>
        </div>
    </li>`;
}

// Paginação
const pagination = {};
const searchInput = document.querySelector('#searchChar');

function setupPagination(currentIndex, maxOptions) {
    pagination.ref = document.querySelector('#pagination');
    pagination.length = null;
    pagination.maxOptions = maxOptions;
    pagination.currentIndex = currentIndex-1;

    pagination.navigation = pagination.ref.querySelector('.navigation');
    pagination.navigation.addEventListener('change', (e) => changePage(e.target.value));
    
    pagination.nextPage = pagination.ref.querySelector('.next-page');
    pagination.nextPage.addEventListener('click', () => nextPage());
    
    pagination.previousPage = pagination.ref.querySelector('.previous-page');
    pagination.previousPage.addEventListener('click', () => previousPage());

    updatePagination();
}

function nextPage(index = null) {
    if (index == null) {
        index = pagination.currentIndex + 1;
    }
    pagination.currentIndex = index % pagination.length;
    updatePage();
}

function previousPage(index = null) {
    if (index == null) {
        index = pagination.currentIndex - 1;
    }
    pagination.currentIndex = (pagination.length + index) % pagination.length;
    updatePage();
}

function changePage(value) {
    if (value > pagination.currentIndex) {
        nextPage(value);
        return;
    }
    if (value < pagination.currentIndex) {
        previousPage(value);
        return;
    }
}

// Ações
async function updateCharacters(search = null, page = null, searchSubmit=false) {
    updateURL(search, page, searchSubmit);
    document.body.scrollIntoView();
    
    const characters = await getCharacters(search, page);
    const charactersDiv = document.querySelector('#characters');
    
    if (characters) {
        charactersDiv.innerHTML = await renderCharacters(characters.results);
        pagination.length = characters.info.pages;
    } else {
        charactersDiv.innerHTML = '';
        pagination.length = 0;
    }

    updatePagination();
}

async function updatePagination() {
    pagination.navigation.innerHTML = '';

    for (let i = 1; i <= pagination.length; i++) {
        pagination.navigation.innerHTML += renderRadio(i);
    }

    pagination.navigation.querySelectorAll('.selector').forEach(selector => {
        selector.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const input = e.target.parentNode.querySelector('input');
                input.checked = input.checked ? false : true;
                changePage(input.value);
            }
        })
    });
    
    pagination.navigation.querySelectorAll('.page-link').forEach( link => {
        link.addEventListener('click', e => {
            e.preventDefault();

            if (e.target.dataset.id - 1 != pagination.currentIndex) {
                e.target.parentNode.querySelector('input').checked = true;
                changePage(e.target.dataset.id - 1);
            }
        })
    });
}

async function updatePage(search=null, resetPage=false, searchSubmit=false) {
    if (resetPage) {
        pagination.currentIndex = 0;
    }

    if (!search) {
        search = searchInput.value;
    }

    await updateCharacters(search, pagination.currentIndex + 1, searchSubmit);

    if (pagination.length > 0) {
        pagination.navigation.querySelector(`input[value="${pagination.currentIndex}"]`).checked = true;
    }
}

function renderURLQueryParams(page, search = null) {
    if (!page) return null;
    if (!search) search = searchInput.value;

    return `${window.location.pathname}?${search ? `search=${encodeURIComponent(search)}&` : ''}page=${encodeURIComponent(page)}`
}

async function updateURL(search = null, page = null, searchSubmit=false) {
    const searchParams = await getURLInfo();

    if (search) searchParams.search = search;
    if (page) searchParams.page = page;

    const newURL = renderURLQueryParams(page, search);
    if (searchSubmit) {
        window.history.pushState({ path: newURL }, '', newURL);
    }
    window.history.replaceState({ path: newURL }, '', newURL);
}

async function setAPIInfo() {
    api.episodes.get().then((result) => {
        document.querySelector('#episode-count').innerText = result.data.info.count;
    }).catch((err) => {
        console.error('Erro ao configurar informação número de episódios no footer:', err);
    });

    api.locations.get().then((result) => {
        document.querySelector('#location-count').innerText = result.data.info.count;
    }).catch((err) => {
        console.error('Erro ao configurar informação número de localizações no footer:', err);
    });

    api.characters.get().then((result) => {
        document.querySelector('#character-count').innerText = result.data.info.count;
    }).catch((err) => {
        console.error('Erro ao configurar informação número de personagens no footer:', err);
        }
    );
}

async function getURLInfo() {
    const searchParams = new URLSearchParams(window.location.search);

    return {
        page: searchParams.get('page') ?? 1,
        search: searchParams.get('search') ?? ''
    }
}

async function setupPage() {
    setAPIInfo();
    const URLInfo = await getURLInfo();

    searchInput.value = URLInfo.search;
    setupPagination(URLInfo.page, 10);
    updateCharacters(URLInfo.search, URLInfo.page);
}

// Triggers
searchInput.addEventListener('input', (e) => {
    updatePage(e.target.value, true);
});

searchInput.form.addEventListener('submit', e => {
    e.preventDefault();
    
    updatePage(e.target.value, true, true);    
});

setupPage();