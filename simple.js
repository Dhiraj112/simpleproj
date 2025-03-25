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
        
        // Show loading state in the stats summary boxes
        totalMatchesEl.textContent = '-';
        totalGoalsEl.textContent = '-';
        avgGoalsEl.textContent = '-';
        
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
            // Reset stats if no data
            leagueStats = {
                totalMatches: 0,
                totalGoals: 0,
                avgGoals: 0
            };
            updateLeagueStats();
        }
    } catch (error) {
        console.error("Error fetching standings:", error);
        teamsContainer.innerHTML = `
            <div class="error-message">
                <p>Error loading data: ${error.message}</p>
                <p>Please try refreshing the page or selecting a different season.</p>
            </div>
        `;
        // Reset stats on error
        leagueStats = {
            totalMatches: 0,
            totalGoals: 0,
            avgGoals: 0
        };
        updateLeagueStats();
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
            const fixtures = data.response.fixtures || {};
            const goals = data.response.goals || {};
            
            const matchesPlayed = (fixtures.played?.total || 0) * (standingsData.length / 2);
            const goalsScored = (goals.for?.total?.total || 0) * standingsData.length;
            
            leagueStats = {
                totalMatches: Math.round(matchesPlayed),
                totalGoals: Math.round(goalsScored),
                avgGoals: matchesPlayed > 0 ? Math.round((goalsScored / matchesPlayed) * 100) / 100 : 0
            };
        } else {
            leagueStats = {
                totalMatches: 0,
                totalGoals: 0,
                avgGoals: 0
            };
        }
    } catch (error) {
        console.error("Error fetching league stats:", error);
        leagueStats = {
            totalMatches: 0,
            totalGoals: 0,
            avgGoals: 0
        };
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
    const clubLogo = document.getElementById('clubLogo');
    clubLogo.src = team.team.logo;
    clubLogo.onerror = function() {
        this.src = 'https://media.api-sports.io/football/teams/default.png';
    };
    
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
        // Show error message to user
        document.getElementById('overview').innerHTML += `
            <div class="error-message">
                <p>There was an error loading some club details. Please try again later.</p>
            </div>
        `;
    });
}

// Fetch team information with improved error handling
async function fetchTeamInfo(teamId) {
    try {
        const response = await fetch(`https://${API_HOST}/teams?id=${teamId}`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(Object.values(data.errors).join(', '));
        }
        
        if (data.response && data.response.length > 0) {
            const teamInfo = data.response[0];
            
            // Fill club information with null checks
            document.getElementById('clubVenue').textContent = teamInfo.venue?.name || 'N/A';
            document.getElementById('clubFounded').textContent = teamInfo.founded || 'N/A';
            document.getElementById('clubCountry').textContent = teamInfo.country || 'N/A';
            document.getElementById('clubCity').textContent = teamInfo.venue?.city || 'N/A';
            document.getElementById('clubStadium').textContent = teamInfo.venue?.name || 'N/A';
            document.getElementById('clubCapacity').textContent = teamInfo.venue?.capacity ? teamInfo.venue.capacity.toLocaleString() : 'N/A';
        } else {
            // Set default values if no team info is found
            const infoFields = ['clubVenue', 'clubFounded', 'clubCountry', 'clubCity', 'clubStadium', 'clubCapacity'];
            infoFields.forEach(field => document.getElementById(field).textContent = 'N/A');
        }
    } catch (error) {
        console.error("Error fetching team info:", error);
        // Set default values on error
        const infoFields = ['clubVenue', 'clubFounded', 'clubCountry', 'clubCity', 'clubStadium', 'clubCapacity'];
        infoFields.forEach(field => document.getElementById(field).textContent = 'N/A');
    }
}

// Fetch team coach/manager with improved error handling
async function fetchCoachInfo(teamId) {
    try {
        const response = await fetch(`https://${API_HOST}/coachs?team=${teamId}`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(Object.values(data.errors).join(', '));
        }
        
        if (data.response && data.response.length > 0) {
            const coach = data.response[0];
            document.getElementById('clubManager').textContent = coach.name || 'N/A';
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
        document.querySelectorAll('.players-grid').forEach(grid => {
            grid.innerHTML = '<div class="no-data">Error loading squad data</div>';
        });
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
        
        // Check for valid photo URL and use fallback if needed
        const playerPhoto = player.photo ? player.photo : 'https://media.api-sports.io/football/players/default.png';
        
        // Handle potential image loading errors
        const imgElement = document.createElement('img');
        imgElement.className = 'player-image';
        imgElement.alt = player.name;
        imgElement.src = playerPhoto;
        imgElement.onerror = function() {
            this.src = 'https://media.api-sports.io/football/players/default.png';
        };
        
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';
        playerInfo.innerHTML = `
            <div class="player-name"><span class="player-number">${player.number || '-'}</span>${player.name}</div>
            <div class="player-position">${player.position}</div>
            <div class="player-age">${player.age || 'N/A'} years</div>
        `;
        
        playerCard.appendChild(imgElement);
        playerCard.appendChild(playerInfo);
        
        container.appendChild(playerCard);
    });
}

// Fetch team fixtures (recent & upcoming matches)
async function fetchTeamFixtures(teamId, season) {
    try {
        // Use fixtures endpoint with team and league parameters 
        // Combine last and next fixtures in a single call to save API requests
        const response = await fetch(`https://${API_HOST}/fixtures?team=${teamId}&league=${PREMIER_LEAGUE_ID}&season=${season}&last=5&next=5`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            throw new Error(Object.values(data.errors).join(', '));
        }
        
        if (data.response && data.response.length > 0) {
            // Check if there are any live fixtures for this team
            const liveFixtures = await checkLiveFixtures(teamId);
            
            // Combine live fixtures with regular fixtures
            const allFixtures = [...data.response, ...liveFixtures];
            
            // Display fixtures with the combined data
            displayFixtures(allFixtures);
        } else {
            document.getElementById('fixturesList').innerHTML = '<div class="no-data">No fixtures found</div>';
        }
    } catch (error) {
        console.error("Error fetching team fixtures:", error);
        document.getElementById('fixturesList').innerHTML = '<div class="no-data">Error loading fixtures</div>';
    }
}

// Check for live fixtures for a specific team
async function checkLiveFixtures(teamId) {
    try {
        // Using the live=all parameter as shown in the sample code
        const response = await fetch(`https://${API_HOST}/fixtures?live=all`, getApiHeaders());
        const data = await response.json();
        
        if (data.errors && data.errors.length > 0) {
            console.error("API Error:", data.errors);
            return []; // Return empty array on error
        }
        
        // Check if response has the expected structure
        if (!data.response || !Array.isArray(data.response)) {
            console.error("Unexpected API response format:", data);
            return [];
        }
        
        // Filter for fixtures involving the specific team
        // The API response has a different structure compared to regular fixtures endpoint
        const teamFixtures = data.response.filter(fixture => 
            fixture.teams.home.id === teamId || fixture.teams.away.id === teamId
        );
        
        // Log for debugging
        console.log(`Found ${teamFixtures.length} live matches for team ${teamId}`);
        
        return teamFixtures;
    } catch (error) {
        console.error("Error checking live fixtures:", error);
        return []; // Return empty array on error
    }
}

// Add a function to handle batch fixture requests as shown in the documentation
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

// Utility function to add a delay between API calls to respect rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch multiple fixtures by ID in batches to minimize API calls
async function fetchFixturesByIds(fixtureIds) {
    try {
        // Group ids into batches of 20 as recommended in the documentation
        const chunkedIds = chunkArray(fixtureIds, 20);
        let allFixtures = [];
        
        for (const idsGroup of chunkedIds) {
            // Create a parameter string with all IDs joined with hyphens
            const idsParam = idsGroup.join("-");
            const url = `https://${API_HOST}/fixtures?ids=${idsParam}`;
            
            const response = await fetch(url, getApiHeaders());
            const data = await response.json();
            
            if (data.response && data.response.length > 0) {
                allFixtures = [...allFixtures, ...data.response];
            }
            
            // Add delay between requests to respect API rate limits
            await delay(1000);
        }
        
        return allFixtures;
    } catch (error) {
        console.error("Error fetching fixtures by IDs:", error);
        return [];
    }
}

// Display fixtures with improved handling for live matches
function displayFixtures(fixtures) {
    const container = document.getElementById('fixturesList');
    container.innerHTML = '';
    
    if (!fixtures || fixtures.length === 0) {
        container.innerHTML = '<div class="no-data">No fixtures available</div>';
        return;
    }
    
    // Sort fixtures by date - live matches first, then by date
    fixtures.sort((a, b) => {
        // Live matches should come first
        const aIsLive = isMatchLive(a);
        const bIsLive = isMatchLive(b);
        
        if (aIsLive && !bIsLive) return -1;
        if (!bIsLive && aIsLive) return 1;
        
        // Then sort by date
        return new Date(a.fixture.date) - new Date(b.fixture.date);
    });
    
    // Group fixtures by category: Live, Upcoming, and Past
    const liveFixtures = fixtures.filter(match => isMatchLive(match));
    
    const upcomingFixtures = fixtures.filter(match => {
        const { isPending } = getMatchStatus(match);
        return isPending;
    });
    
    const pastFixtures = fixtures.filter(match => {
        const { isFinished } = getMatchStatus(match);
        return isFinished;
    });
    
    // Only show section headers if there are matches in that section
    if (liveFixtures.length > 0) {
        appendFixtureSection(container, 'Live Matches', liveFixtures, true);
    }
    
    if (upcomingFixtures.length > 0) {
        appendFixtureSection(container, 'Upcoming Matches', upcomingFixtures);
    }
    
    if (pastFixtures.length > 0) {
        appendFixtureSection(container, 'Recent Matches', pastFixtures);
    }
}

// Helper function to append a section of fixtures
function appendFixtureSection(container, title, fixtures, isLive = false) {
    const sectionTitle = document.createElement('h4');
    sectionTitle.className = 'fixture-section-title';
    sectionTitle.textContent = title;
    
    // Add a pulsing dot for live sections
    if (isLive) {
        const liveDot = document.createElement('span');
        liveDot.className = 'live-indicator';
        sectionTitle.appendChild(liveDot);
    }
    
    container.appendChild(sectionTitle);
    
    // Create fixtures list for this section
    const sectionList = document.createElement('div');
    sectionList.className = 'fixtures-list';
    
    fixtures.forEach(match => {
        const fixtureCard = createFixtureCard(match, isLive);
        sectionList.appendChild(fixtureCard);
    });
    
    container.appendChild(sectionList);
}

// Create a fixture card with improved display for live matches
function createFixtureCard(match, isLive = false) {
    const fixtureCard = document.createElement('div');
    fixtureCard.className = 'fixture-card';
    
    // Use helper function to determine if match is live
    const matchIsLive = isMatchLive(match);
    if (isLive || matchIsLive) {
        fixtureCard.classList.add('live-fixture');
        isLive = true; // Ensure isLive is true if match is detected as live
    }
    
    const matchDate = new Date(match.fixture.date);
    const formattedDate = matchDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
    const formattedTime = matchDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Determine fixture status and score display
    let scoreDisplay = 'vs';
    let statusDisplay = '';
    let statusCode = match.fixture.status.short || '';
    
    // Use helper function to determine match status
    const { isFinished, isPending } = getMatchStatus(match);
    
    if (isLive) {
        // Display the current score for live matches
        scoreDisplay = `${match.goals.home} - ${match.goals.away}`;
        
        // Show elapsed time if available, otherwise show status short code
        if (match.fixture.status.elapsed) {
            statusDisplay = `${match.fixture.status.elapsed}'`;
            statusCode = match.fixture.status.short;
        } else if (match.fixture.status.short === 'HT') {
            statusDisplay = 'HT';
            statusCode = 'HT';
        } else {
            statusDisplay = match.fixture.status.short;
            statusCode = match.fixture.status.short;
        }
    } else if (isFinished) {
        scoreDisplay = `${match.goals.home} - ${match.goals.away}`;
        statusDisplay = match.fixture.status.short;
        statusCode = match.fixture.status.short;
    } else if (isPending) {
        statusDisplay = formattedTime;
        statusCode = 'NS';
    } else {
        statusDisplay = match.fixture.status.short;
        statusCode = match.fixture.status.short;
    }
    
    // Create home team logo with error handling
    const homeLogoImg = document.createElement('img');
    homeLogoImg.className = 'fixture-team-logo';
    homeLogoImg.alt = match.teams.home.name;
    homeLogoImg.src = match.teams.home.logo;
    homeLogoImg.onerror = function() {
        this.src = 'https://media.api-sports.io/football/teams/default.png';
    };
    
    // Create away team logo with error handling
    const awayLogoImg = document.createElement('img');
    awayLogoImg.className = 'fixture-team-logo';
    awayLogoImg.alt = match.teams.away.name;
    awayLogoImg.src = match.teams.away.logo;
    awayLogoImg.onerror = function() {
        this.src = 'https://media.api-sports.io/football/teams/default.png';
    };
    
    // Left side - Date & status
    const dateContainer = document.createElement('div');
    dateContainer.className = 'fixture-date-container';
    
    const dateDiv = document.createElement('div');
    dateDiv.className = 'fixture-date';
    dateDiv.textContent = formattedDate;
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'fixture-status';
    statusDiv.setAttribute('data-status', statusCode);
    if (isLive) {
        statusDiv.classList.add('live-status');
    }
    statusDiv.textContent = statusDisplay;
    
    dateContainer.appendChild(dateDiv);
    dateContainer.appendChild(statusDiv);
    
    // Center - Teams and score
    // Create home team element
    const homeTeamDiv = document.createElement('div');
    homeTeamDiv.className = 'fixture-team home';
    const homeTeamSpan = document.createElement('span');
    homeTeamSpan.textContent = match.teams.home.name;
    homeTeamDiv.appendChild(homeTeamSpan);
    homeTeamDiv.appendChild(homeLogoImg);
    
    // Add winner indicator if available
    if (match.teams.home.winner === true) {
        homeTeamDiv.classList.add('winner');
    }
    
    // Create score element
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'fixture-score';
    if (isLive) {
        scoreDiv.classList.add('live-score');
    }
    scoreDiv.textContent = scoreDisplay;
    
    // Add halftime score when available
    if ((isLive || isFinished) && match.score && match.score.halftime && 
        match.score.halftime.home !== null && match.score.halftime.away !== null) {
        const halfTimeScoreDiv = document.createElement('div');
        halfTimeScoreDiv.className = 'halftime-score';
        halfTimeScoreDiv.textContent = `HT: ${match.score.halftime.home} - ${match.score.halftime.away}`;
        scoreDiv.appendChild(halfTimeScoreDiv);
    }
    
    // Create away team element
    const awayTeamDiv = document.createElement('div');
    awayTeamDiv.className = 'fixture-team away';
    awayTeamDiv.appendChild(awayLogoImg);
    const awayTeamSpan = document.createElement('span');
    awayTeamSpan.textContent = match.teams.away.name;
    awayTeamDiv.appendChild(awayTeamSpan);
    
    // Add winner indicator if available
    if (match.teams.away.winner === true) {
        awayTeamDiv.classList.add('winner');
    }
    
    // Create teams container
    const teamsDiv = document.createElement('div');
    teamsDiv.className = 'fixture-teams';
    teamsDiv.appendChild(homeTeamDiv);
    teamsDiv.appendChild(scoreDiv);
    teamsDiv.appendChild(awayTeamDiv);
    
    // Right side - Venue
    const venueDiv = document.createElement('div');
    venueDiv.className = 'fixture-venue';
    venueDiv.textContent = match.fixture.venue.name || 'TBD';
    
    // Append all to fixture card
    fixtureCard.appendChild(dateContainer);
    fixtureCard.appendChild(teamsDiv);
    fixtureCard.appendChild(venueDiv);
    
    return fixtureCard;
}

// Helper function to determine if a match is live
function isMatchLive(match) {
    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'];
    return liveStatuses.includes(match.fixture.status.short);
}

// Helper function to get match status
function getMatchStatus(match) {
    const finishedStatuses = ['FT', 'AET', 'PEN'];
    const pendingStatuses = ['NS', 'TBD', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];
    
    return {
        isFinished: finishedStatuses.includes(match.fixture.status.short),
        isPending: pendingStatuses.includes(match.fixture.status.short),
        isLive: isMatchLive(match)
    };
}

// Fetch team statistics with better error handling
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
            } else {
                document.getElementById('formationName').textContent = 'N/A';
                document.getElementById('formationPlayed').textContent = 'N/A';
                document.getElementById('formationWinRate').textContent = 'N/A';
                document.getElementById('formationGoalsPerGame').textContent = 'N/A';
            }
            
            // Also fetch player statistics
            fetchPlayerStatistics(teamId, season);
        } else {
            // Set default values if no statistics are found
            document.getElementById('formationName').textContent = 'N/A';
            document.getElementById('formationPlayed').textContent = 'N/A';
            document.getElementById('formationWinRate').textContent = 'N/A';
            document.getElementById('formationGoalsPerGame').textContent = 'N/A';
        }
    } catch (error) {
        console.error("Error fetching team statistics:", error);
        // Set default values on error
        document.getElementById('formationName').textContent = 'N/A';
        document.getElementById('formationPlayed').textContent = 'N/A';
        document.getElementById('formationWinRate').textContent = 'N/A';
        document.getElementById('formationGoalsPerGame').textContent = 'N/A';
    }
}

// Display formation with null checking
function displayFormation(formation) {
    if (!formation) {
        document.getElementById('formationName').textContent = 'N/A';
        document.getElementById('formationPlayed').textContent = 'N/A';
        document.getElementById('formationWinRate').textContent = 'N/A';
        document.getElementById('formationGoalsPerGame').textContent = 'N/A';
        return;
    }
    
    document.getElementById('formationName').textContent = formation.formation || 'N/A';
    document.getElementById('formationPlayed').textContent = formation.played || '0';
    
    const winRate = formation.played > 0 && formation.wins?.total ? 
        Math.round((formation.wins.total / formation.played) * 100) : 0;
    document.getElementById('formationWinRate').textContent = `${winRate}%`;
    
    const goalsPerGame = formation.played > 0 && formation.goals?.for?.total ? 
        (formation.goals.for.total / formation.played).toFixed(2) : '0.00';
    document.getElementById('formationGoalsPerGame').textContent = goalsPerGame;
    
    // Visual representation of formation
    const formationPitch = document.getElementById('formationPitch');
    formationPitch.innerHTML = '';
    
    if (!formation.formation) {
        formationPitch.innerHTML = '<div class="no-data">No formation data available</div>';
        return;
    }
    
    try {
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
    } catch (error) {
        console.error("Error displaying formation:", error);
        formationPitch.innerHTML = '<div class="no-data">Error displaying formation</div>';
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

// Display top scorers with improved error handling
function displayTopScorers(players) {
    try {
        // Sort by goals
        const topScorers = [...players]
            .sort((a, b) => {
                const aGoals = a.statistics[0]?.goals?.total || 0;
                const bGoals = b.statistics[0]?.goals?.total || 0;
                return bGoals - aGoals;
            })
            .slice(0, 5);
        
        displayStatList('topScorers', topScorers, player => player.statistics[0]?.goals?.total || 0, 'Goals');
    } catch (error) {
        console.error("Error displaying top scorers:", error);
        document.getElementById('topScorers').innerHTML = '<div class="no-data">Error loading goal statistics</div>';
    }
}

// Display top assists with improved error handling
function displayTopAssists(players) {
    try {
        // Sort by assists
        const topAssists = [...players]
            .sort((a, b) => {
                const aAssists = a.statistics[0]?.goals?.assists || 0;
                const bAssists = b.statistics[0]?.goals?.assists || 0;
                return bAssists - aAssists;
            })
            .slice(0, 5);
        
        displayStatList('topAssists', topAssists, player => player.statistics[0]?.goals?.assists || 0, 'Assists');
    } catch (error) {
        console.error("Error displaying top assists:", error);
        document.getElementById('topAssists').innerHTML = '<div class="no-data">Error loading assist statistics</div>';
    }
}

// Display most cards
function displayMostCards(players) {
    try {
        // Sort by total cards
        const mostCards = [...players]
            .sort((a, b) => {
                const aCards = (a.statistics[0]?.cards?.yellow || 0) + (a.statistics[0]?.cards?.red || 0);
                const bCards = (b.statistics[0]?.cards?.yellow || 0) + (b.statistics[0]?.cards?.red || 0);
                return bCards - aCards;
            })
            .slice(0, 5);
        
        displayStatList('mostCards', mostCards, player => {
            const yellowCards = player.statistics[0]?.cards?.yellow || 0;
            const redCards = player.statistics[0]?.cards?.red || 0;
            return yellowCards + redCards;
        }, 'Cards');
    } catch (error) {
        console.error("Error displaying cards:", error);
        document.getElementById('mostCards').innerHTML = '<div class="no-data">Error loading card statistics</div>';
    }
}

// Display most appearances
function displayMostAppearances(players) {
    try {
        // Sort by appearances
        const mostAppearances = [...players]
            .sort((a, b) => (b.statistics[0]?.games?.appearences || 0) - (a.statistics[0]?.games?.appearences || 0))
            .slice(0, 5);
        
        displayStatList('mostAppearances', mostAppearances, player => player.statistics[0]?.games?.appearences || 0, 'Apps');
    } catch (error) {
        console.error("Error displaying appearances:", error);
        document.getElementById('mostAppearances').innerHTML = '<div class="no-data">Error loading appearance statistics</div>';
    }
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
        
        // Create image element with error handling
        const imgElement = document.createElement('img');
        imgElement.className = 'stats-player-image';
        imgElement.alt = player.player.name;
        imgElement.src = player.player.photo || 'https://media.api-sports.io/football/players/default.png';
        imgElement.onerror = function() {
            this.src = 'https://media.api-sports.io/football/players/default.png';
        };
        
        const nameElement = document.createElement('div');
        nameElement.className = 'stats-player-name';
        nameElement.textContent = player.player.name;
        
        const valueElement = document.createElement('div');
        valueElement.className = 'stats-value';
        valueElement.textContent = `${statValue} ${label}`;
        
        statItem.appendChild(imgElement);
        statItem.appendChild(nameElement);
        statItem.appendChild(valueElement);
        
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

// Initialize with better error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Add global error handler for APIs
        window.onerror = function(message, source, lineno, colno, error) {
            console.error('Global error:', message, error);
            if (message.includes('API') || message.includes('fetch')) {
                alert('There was an error connecting to the football data service. Please check your internet connection and try again later.');
            }
            return false;
        };
        
        // Set up event listeners
        setupEventListeners();
        
        // Initial data load
        const currentSeason = filterSeason.value;
        fetchStandings(currentSeason);
    } catch (error) {
        console.error("Error during initialization:", error);
        teamsContainer.innerHTML = '<div class="loading">Error initializing application. Please refresh the page.</div>';
    }
});

// Set up all event listeners in one place for better organization
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', () => {
        try {
            displayTeams();
        } catch (error) {
            console.error("Error in search input handling:", error);
            teamsContainer.innerHTML = '<div class="loading">Error filtering teams. Please try again.</div>';
        }
    });
    
    // Sort dropdown
    sortBy.addEventListener('change', () => {
        try {
            displayTeams();
        } catch (error) {
            console.error("Error in sort handling:", error);
            teamsContainer.innerHTML = '<div class="loading">Error sorting teams. Please try again.</div>';
        }
    });
    
    // Season filter
    filterSeason.addEventListener('change', function() {
        try {
            fetchStandings(this.value);
        } catch (error) {
            console.error("Error in season filter handling:", error);
            teamsContainer.innerHTML = '<div class="loading">Error loading season data. Please try again.</div>';
        }
    });
    
    // Close modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            try {
                setActiveTab(button.dataset.tab);
            } catch (error) {
                console.error("Error switching tabs:", error);
            }
        });
    });
    
    // Handling image errors globally
    document.addEventListener('error', function(e) {
        if (e.target.tagName.toLowerCase() === 'img') {
            console.log('Image loading error:', e.target.src);
            
            // Check what type of image failed and use appropriate fallback
            if (e.target.classList.contains('team-logo') || e.target.classList.contains('club-details-logo') || e.target.classList.contains('fixture-team-logo')) {
                e.target.src = 'https://media.api-sports.io/football/teams/default.png';
            } else if (e.target.classList.contains('player-image') || e.target.classList.contains('stats-player-image')) {
                e.target.src = 'https://media.api-sports.io/football/players/default.png';
            }
        }
    }, true);
}
