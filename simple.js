// API configuration
const API_KEY = "d1e21f4cd6c972336b285f5efcb9a746";
const API_HOST = "v3.football.api-sports.io";
const PREMIER_LEAGUE_ID = 39; // Premier League ID in API-Sports

// DOM elements
const teamsContainer = document.getElementById('teamsContainer');
const searchInput = document.getElementById('searchInput');
const filterSeason = document.getElementById('filterSeason');
const sortBy = document.getElementById('sortBy');
const totalMatchesEl = document.getElementById('totalMatches');
const totalGoalsEl = document.getElementById('totalGoals');
const avgGoalsEl = document.getElementById('avgGoals');
const modal = document.getElementById('clubDetailsModal');
const closeModal = document.querySelector('.close-modal');
const modalLoader = document.getElementById('modalLoader');

// Store the fetched data
let teamData = [];
let standingsData = [];
let leagueStats = {
    totalMatches: 0,
    totalGoals: 0,
    avgGoals: 0
};

// Set up API headers
function getApiHeaders() {
    const headers = new Headers();
    headers.append("x-rapidapi-key", API_KEY);
    headers.append("x-rapidapi-host", API_HOST);
    return {
        method: 'GET',
        headers: headers,
        redirect: 'follow'
    };
}

// Fetch standings data
async function fetchStandings(season) {
    try {
        teamsContainer.innerHTML = '<div class="loading">Loading Premier League data...</div>';
        
        const response = await fetch(`https://${API_HOST}/standings?league=${PREMIER_LEAGUE_ID}&season=${season}`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(Object.values(data.errors).join(', '));
        }
        
        if (data.response && data.response.length > 0) {
            standingsData = data.response[0].league.standings[0];
            await fetchLeagueStats(season);
            updateLeagueStats();
            displayTeams();
        } else {
            teamsContainer.innerHTML = '<div class="loading">No data available for this season.</div>';
        }
    } catch (error) {
        console.error("Error fetching standings:", error);
        teamsContainer.innerHTML = `<div class="loading">Error loading data: ${error.message}</div>`;
    }
}

// Fetch league stats (matches, goals, etc)
async function fetchLeagueStats(season) {
    try {
        const response = await fetch(`https://${API_HOST}/teams/statistics?league=${PREMIER_LEAGUE_ID}&season=${season}&team=40`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(Object.values(data.errors).join(', '));
        }
        
        if (data.response && Object.keys(data.response).length > 0) {
            // Use team data as a sample to get league info
            const matchesPlayed = data.response.fixtures.played.total * (standingsData.length / 2);
            const goalsScored = data.response.goals.for.total.total * standingsData.length;
            
            leagueStats = {
                totalMatches: Math.round(matchesPlayed),
                totalGoals: Math.round(goalsScored),
                avgGoals: Math.round((goalsScored / matchesPlayed) * 100) / 100
            };
        }
    } catch (error) {
        console.error("Error fetching league stats:", error);
    }
}

// Update the league stats display
function updateLeagueStats() {
    totalMatchesEl.textContent = leagueStats.totalMatches;
    totalGoalsEl.textContent = leagueStats.totalGoals;
    avgGoalsEl.textContent = leagueStats.avgGoals;
}

// Format team form (last 5 matches)
function formatTeamForm(form) {
    if (!form) return '';
    
    return form.split('').map(result => {
        let className = '';
        switch (result) {
            case 'W': className = 'form-W'; break;
            case 'L': className = 'form-L'; break;
            case 'D': className = 'form-D'; break;
            default: className = ''; break;
        }
        
        return `<div class="form-item ${className}">${result}</div>`;
    }).join('');
}

// Create team card element
function createTeamCard(team) {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.dataset.teamId = team.team.id;
    
    card.innerHTML = `
        <div class="team-rank">${team.rank}</div>
        <div class="team-image">
            <img src="${team.team.logo}" alt="${team.team.name}" class="team-logo">
        </div>
        <div class="team-info">
            <h3 class="team-name">${team.team.name}</h3>
            <p class="team-points">${team.points} Points</p>
            <p class="team-stats"><strong>Played:</strong> <span>${team.all.played}</span></p>
            <p class="team-stats"><strong>Won:</strong> <span>${team.all.win}</span></p>
            <p class="team-stats"><strong>Drawn:</strong> <span>${team.all.draw}</span></p>
            <p class="team-stats"><strong>Lost:</strong> <span>${team.all.lose}</span></p>
            <p class="team-stats"><strong>Goals:</strong> <span>${team.all.goals.for} : ${team.all.goals.against}</span></p>
            <p class="team-stats"><strong>Goal Diff:</strong> <span>${team.goalsDiff}</span></p>
            <div class="team-form">${formatTeamForm(team.form)}</div>
        </div>
    `;
    
    // Add animation when card is created
    setTimeout(() => {
        card.classList.add('visible');
    }, 50);
    
    // Add click event to show club details
    card.addEventListener('click', () => {
        openClubDetails(team);
    });
    
    return card;
}

// Display teams based on filters and sorting
function displayTeams() {
    const searchTerm = searchInput.value.toLowerCase();
    const sortOption = sortBy.value;
    
    // Clear previous content
    teamsContainer.innerHTML = '';
    
    // Filter teams
    let filteredTeams = standingsData.filter(team => {
        const matchesSearch = team.team.name.toLowerCase().includes(searchTerm);
        return matchesSearch;
    });
    
    // Sort teams
    filteredTeams.sort((a, b) => {
        if (sortOption === 'rank') {
            return a.rank - b.rank;
        } else if (sortOption === 'points-desc') {
            return b.points - a.points;
        } else if (sortOption === 'name') {
            return a.team.name.localeCompare(b.team.name);
        } else if (sortOption === 'wins-desc') {
            return b.all.win - a.all.win;
        } else if (sortOption === 'goals-desc') {
            return b.all.goals.for - a.all.goals.for;
        }
        return 0;
    });
    
    // Display message if no results
    if (filteredTeams.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'loading';
        noResults.textContent = 'No teams found matching your criteria.';
        teamsContainer.appendChild(noResults);
        return;
    }
    
    // Show count of results
    const resultCount = document.createElement('div');
    resultCount.className = 'result-count';
    resultCount.textContent = `Showing ${filteredTeams.length} of ${standingsData.length} teams`;
    teamsContainer.appendChild(resultCount);
    
    // Add team cards to container with staggered animation
    filteredTeams.forEach((team, index) => {
        const card = createTeamCard(team);
        card.style.animationDelay = `${index * 0.1}s`;
        teamsContainer.appendChild(card);
    });
}

// Modal functionality
function openClubDetails(team) {
    // Show modal
    modal.style.display = 'block';
    modalLoader.style.display = 'flex';
    
    // Set club name and logo
    document.getElementById('clubName').textContent = team.team.name;
    document.getElementById('clubLogo').src = team.team.logo;
    
    // Fill in season summary
    document.getElementById('seasonRank').textContent = team.rank;
    document.getElementById('seasonPoints').textContent = team.points;
    document.getElementById('seasonWins').textContent = team.all.win;
    document.getElementById('seasonDraws').textContent = team.all.draw;
    document.getElementById('seasonLosses').textContent = team.all.lose;
    document.getElementById('seasonGoalsFor').textContent = team.all.goals.for;
    document.getElementById('seasonGoalsAgainst').textContent = team.all.goals.against;
    
    // Reset active tab
    setActiveTab('overview');
    
    // Fetch club details
    const currentSeason = filterSeason.value;
    
    // Make multiple API calls concurrently
    Promise.all([
        fetchTeamInfo(team.team.id),
        fetchTeamSquad(team.team.id),
        fetchTeamFixtures(team.team.id, currentSeason),
        fetchTeamStatistics(team.team.id, currentSeason)
    ]).then(() => {
        modalLoader.style.display = 'none';
    }).catch(error => {
        console.error("Error loading club details:", error);
        modalLoader.style.display = 'none';
    });
}

// Fetch team information
async function fetchTeamInfo(teamId) {
    try {
        const response = await fetch(`https://${API_HOST}/teams?id=${teamId}`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(Object.values(data.errors).join(', '));
        }
        
        if (data.response && data.response.length > 0) {
            const teamInfo = data.response[0];
            
            // Fill club information
            document.getElementById('clubVenue').textContent = teamInfo.venue.name;
            document.getElementById('clubFounded').textContent = teamInfo.founded || 'N/A';
            document.getElementById('clubCountry').textContent = teamInfo.country;
            document.getElementById('clubCity').textContent = teamInfo.venue.city || 'N/A';
            document.getElementById('clubStadium').textContent = teamInfo.venue.name;
            document.getElementById('clubCapacity').textContent = teamInfo.venue.capacity ? teamInfo.venue.capacity.toLocaleString() : 'N/A';
        }
    } catch (error) {
        console.error("Error fetching team info:", error);
    }
}

// Fetch team coach/manager
async function fetchCoachInfo(teamId) {
    try {
        const response = await fetch(`https://${API_HOST}/coachs?team=${teamId}`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(Object.values(data.errors).join(', '));
        }
        
        if (data.response && data.response.length > 0) {
            const coach = data.response[0];
            document.getElementById('clubManager').textContent = coach.name;
        } else {
            document.getElementById('clubManager').textContent = 'N/A';
        }
    } catch (error) {
        console.error("Error fetching coach info:", error);
        document.getElementById('clubManager').textContent = 'N/A';
    }
}

// Fetch team squad
async function fetchTeamSquad(teamId) {
    try {
        const response = await fetch(`https://${API_HOST}/players/squads?team=${teamId}`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(Object.values(data.errors).join(', '));
        }
        
        if (data.response && data.response.length > 0) {
            const squad = data.response[0].players;
            
            // Group players by position
            const goalkeepers = squad.filter(player => player.position === 'Goalkeeper');
            const defenders = squad.filter(player => player.position === 'Defender');
            const midfielders = squad.filter(player => player.position === 'Midfielder');
            const attackers = squad.filter(player => player.position === 'Attacker');
            
            // Display players by position
            displayPositionGroup('goalkeepers', goalkeepers);
            displayPositionGroup('defenders', defenders);
            displayPositionGroup('midfielders', midfielders);
            displayPositionGroup('attackers', attackers);
            
            // Also fetch coach info since we're displaying team members
            fetchCoachInfo(teamId);
        }
    } catch (error) {
        console.error("Error fetching team squad:", error);
    }
}

// Display players by position
function displayPositionGroup(elementId, players) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    
    if (players.length === 0) {
        container.innerHTML = '<div class="no-data">No players found</div>';
        return;
    }
    
    players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        
        const playerPhoto = player.photo || 'https://media.api-sports.io/football/players/default.png';
        
        playerCard.innerHTML = `
            <img src="${playerPhoto}" alt="${player.name}" class="player-image">
            <div class="player-info">
                <div class="player-name"><span class="player-number">${player.number || '-'}</span>${player.name}</div>
                <div class="player-position">${player.position}</div>
                <div class="player-age">${player.age} years</div>
            </div>
        `;
        
        container.appendChild(playerCard);
    });
}

// Fetch team fixtures (recent & upcoming matches)
async function fetchTeamFixtures(teamId, season) {
    try {
        const response = await fetch(`https://${API_HOST}/fixtures?team=${teamId}&league=${PREMIER_LEAGUE_ID}&season=${season}&last=5&next=5`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(Object.values(data.errors).join(', '));
        }
        
        if (data.response && data.response.length > 0) {
            displayFixtures(data.response);
        } else {
            document.getElementById('fixturesList').innerHTML = '<div class="no-data">No fixtures found</div>';
        }
    } catch (error) {
        console.error("Error fetching team fixtures:", error);
    }
}

// Display fixtures
function displayFixtures(fixtures) {
    const container = document.getElementById('fixturesList');
    container.innerHTML = '';
    
    // Sort fixtures by date
    fixtures.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
    
    fixtures.forEach(match => {
        const fixtureCard = document.createElement('div');
        fixtureCard.className = 'fixture-card';
        
        const matchDate = new Date(match.fixture.date);
        const formattedDate = matchDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        const isFinished = match.fixture.status.short === 'FT';
        const isPending = match.fixture.status.short === 'NS';
        
        const homeScore = isFinished ? match.goals.home : '-';
        const awayScore = isFinished ? match.goals.away : '-';
        const scoreDisplay = isFinished ? `${homeScore} - ${awayScore}` : (isPending ? 'vs' : match.fixture.status.short);
        
        fixtureCard.innerHTML = `
            <div class="fixture-date">${formattedDate}</div>
            <div class="fixture-teams">
                <div class="fixture-team home">
                    <span>${match.teams.home.name}</span>
                    <img src="${match.teams.home.logo}" alt="${match.teams.home.name}" class="fixture-team-logo">
                </div>
                <div class="fixture-score">
                    ${scoreDisplay}
                </div>
                <div class="fixture-team away">
                    <img src="${match.teams.away.logo}" alt="${match.teams.away.name}" class="fixture-team-logo">
                    <span>${match.teams.away.name}</span>
                </div>
            </div>
            <div class="fixture-venue">${match.fixture.venue.name}</div>
        `;
        
        container.appendChild(fixtureCard);
    });
}

// Fetch team statistics
async function fetchTeamStatistics(teamId, season) {
    try {
        const response = await fetch(`https://${API_HOST}/teams/statistics?team=${teamId}&league=${PREMIER_LEAGUE_ID}&season=${season}`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(Object.values(data.errors).join(', '));
        }
        
        if (data.response && Object.keys(data.response).length > 0) {
            const stats = data.response;
            
            // Display formation
            if (stats.lineups && stats.lineups.length > 0) {
                const mostUsedFormation = stats.lineups.sort((a, b) => b.played - a.played)[0];
                displayFormation(mostUsedFormation);
            }
            
            // Also fetch player statistics
            fetchPlayerStatistics(teamId, season);
        }
    } catch (error) {
        console.error("Error fetching team statistics:", error);
    }
}

// Display formation
function displayFormation(formation) {
    document.getElementById('formationName').textContent = formation.formation;
    document.getElementById('formationPlayed').textContent = formation.played;
    document.getElementById('formationWinRate').textContent = `${Math.round((formation.played > 0 ? formation.wins.total / formation.played * 100 : 0))}%`;
    document.getElementById('formationGoalsPerGame').textContent = (formation.goals.for.total / formation.played).toFixed(2);
    
    // Visual representation of formation
    const formationPitch = document.getElementById('formationPitch');
    formationPitch.innerHTML = '';
    
    // Parse formation (e.g., "4-3-3" to [4, 3, 3])
    const positions = formation.formation.split('-').map(Number);
    
    // Add goalkeeper
    addPlayerToFormation(formationPitch, 50, 90, 'GK');
    
    // Add outfield players
    let currentY = 75;
    let totalPlayers = 1; // Starting with 1 for the goalkeeper
    
    for (let i = 0; i < positions.length; i++) {
        const playersInRow = positions[i];
        const spacing = 100 / (playersInRow + 1);
        
        for (let j = 0; j < playersInRow; j++) {
            const x = spacing * (j + 1);
            addPlayerToFormation(formationPitch, x, currentY, totalPlayers + 1);
            totalPlayers++;
        }
        
        currentY -= 20;
    }
}

// Add player to formation visual
function addPlayerToFormation(container, x, y, number) {
    const player = document.createElement('div');
    player.className = 'formation-player';
    player.style.left = `${x}%`;
    player.style.top = `${y}%`;
    player.textContent = number;
    container.appendChild(player);
}

// Fetch player statistics
async function fetchPlayerStatistics(teamId, season) {
    try {
        const response = await fetch(`https://${API_HOST}/players?team=${teamId}&league=${PREMIER_LEAGUE_ID}&season=${season}`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(Object.values(data.errors).join(', '));
        }
        
        if (data.response && data.response.length > 0) {
            const players = data.response;
            
            // Process player statistics
            displayTopScorers(players);
            displayTopAssists(players);
            displayMostCards(players);
            displayMostAppearances(players);
        }
    } catch (error) {
        console.error("Error fetching player statistics:", error);
    }
}

// Display top scorers
function displayTopScorers(players) {
    // Sort by goals
    const topScorers = [...players]
        .sort((a, b) => (b.statistics[0].goals.total || 0) - (a.statistics[0].goals.total || 0))
        .slice(0, 5);
    
    displayStatList('topScorers', topScorers, player => player.statistics[0].goals.total || 0, 'Goals');
}

// Display top assists
function displayTopAssists(players) {
    // Sort by assists
    const topAssists = [...players]
        .sort((a, b) => (b.statistics[0].goals.assists || 0) - (a.statistics[0].goals.assists || 0))
        .slice(0, 5);
    
    displayStatList('topAssists', topAssists, player => player.statistics[0].goals.assists || 0, 'Assists');
}

// Display most cards
function displayMostCards(players) {
    // Sort by total cards
    const mostCards = [...players]
        .sort((a, b) => {
            const aCards = (a.statistics[0].cards.yellow || 0) + (a.statistics[0].cards.red || 0);
            const bCards = (b.statistics[0].cards.yellow || 0) + (b.statistics[0].cards.red || 0);
            return bCards - aCards;
        })
        .slice(0, 5);
    
    displayStatList('mostCards', mostCards, player => {
        return (player.statistics[0].cards.yellow || 0) + (player.statistics[0].cards.red || 0);
    }, 'Cards');
}

// Display most appearances
function displayMostAppearances(players) {
    // Sort by appearances
    const mostAppearances = [...players]
        .sort((a, b) => (b.statistics[0].games.appearences || 0) - (a.statistics[0].games.appearences || 0))
        .slice(0, 5);
    
    displayStatList('mostAppearances', mostAppearances, player => player.statistics[0].games.appearences || 0, 'Apps');
}

// Generic function to display stat list
function displayStatList(elementId, players, statFunction, label) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    
    if (players.length === 0) {
        container.innerHTML = '<div class="no-data">No data available</div>';
        return;
    }
    
    players.forEach(player => {
        const statValue = statFunction(player);
        if (statValue <= 0) return;
        
        const statItem = document.createElement('div');
        statItem.className = 'stats-item';
        
        const playerPhoto = player.player.photo || 'https://media.api-sports.io/football/players/default.png';
        
        statItem.innerHTML = `
            <img src="${playerPhoto}" alt="${player.player.name}" class="stats-player-image">
            <div class="stats-player-name">${player.player.name}</div>
            <div class="stats-value">${statValue} ${label}</div>
        `;
        
        container.appendChild(statItem);
    });
    
    if (container.children.length === 0) {
        container.innerHTML = '<div class="no-data">No data available</div>';
    }
}

// Tab functionality
function setActiveTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
        if (button.dataset.tab === tabId) {
            button.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === tabId) {
            tab.classList.add('active');
        }
    });
}

// Event listeners
searchInput.addEventListener('input', displayTeams);
sortBy.addEventListener('change', displayTeams);
filterSeason.addEventListener('change', function() {
    fetchStandings(this.value);
});

// Close modal when clicking on close button or outside the modal
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Tab navigation
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        setActiveTab(button.dataset.tab);
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const currentSeason = filterSeason.value;
    fetchStandings(currentSeason);
});
