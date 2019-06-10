const clientID = '312acf72a4004192948b99d8d016ba63';
const redirectURI = "http://localhost:3000/";
let accessToken;
let expiresIn;

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        } 

        const urlHasAccessToken = window.location.href.match(/access_token=([^&]*)/);
        const urlHasExpiresIn = window.location.href.match(/expires_in=([^&]*)/);

        if (urlHasAccessToken && urlHasExpiresIn) {
            accessToken = urlHasAccessToken[1];
            expiresIn = urlHasExpiresIn[1];

            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');

            return accessToken;
        } else {
            window.location = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
        }
    },
    
    search(term) {
        const endpoint = `https://api.spotify.com/v1/search?type=track&q=${term}`;
        Spotify.getAccessToken();
        return fetch(endpoint, {headers: {Authorization: `Bearer ${accessToken}`}})
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Request failed!');
            }, networkError => console.log(networkError.message))
            .then(jsonResponse => {
                if (!jsonResponse.tracks) {
                    return [];
                } else {
                    return jsonResponse.tracks.items.map(track => 
                        ({
                            id: track.id,
                            name: track.name,
                            artist: track.artists[0].name,
                            album: track.album.name,
                            uri: track.uri
                        })
                    )
                }
            })
    },

    savePlaylist(playlistName, trackURIs) {
        if (!playlistName || !trackURIs.length) {
            return ;
        }

        const accessToken = Spotify.getAccessToken();
        const headers = {Authorization : `Bearer ${accessToken}`};
        let userID;
    
        return fetch(`https://api.spotify.com/v1/me`, {headers : headers})
            .then(response=> {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Request failed!');
            }, networkError => console.log(networkError.message))
            .then(jsonResponse => {
                userID = jsonResponse.id;
                
                return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
                            headers: headers,
                            method: 'POST',
                            body: JSON.stringify({name : playlistName})
                        }).then(response => {
                            if (response.ok) {
                                return response.json();
                            }
                            throw new Error('Request failed');
                        }, networkError => console.log(networkError.message)
                        ).then(jsonResponse => {
                            let playlistID = jsonResponse.id;
                            
                            return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, {
                                headers: headers,
                                method: 'POST',
                                body: JSON.stringify({uris : trackURIs})
                            });
                        }); 
            });
    }

    
};



export default Spotify;