import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, InputGroup, FormControl, Button, Row, Card } from 'react-bootstrap';
import { useState, useEffect } from 'react';

const clientId = `${process.env.REACT_APP_CLIENT_ID}`; // Your client id
const clientSecret = `${process.env.REACT_APP_CLIENT_SECRET}`; // Your secret

function App() {

  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [albums, setAlbums] = useState([]);

  useEffect(() => {

    // API Access Token
    let authParameters = {  //Spotify makes you request access token in a specific way, kind of complicated
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&client_id=' + clientId + '&client_secret=' + clientSecret
    }

    fetch('https://accounts.spotify.com/api/token', authParameters)
      .then(result => result.json())
      .then(data => setAccessToken(data.access_token))

  }, []) // useEffect is great for API calls, set up this way (empty array) to only run once

  // search function needs to be async due to multiple fetch calls, need each fetch to wait its turn
  async function search() {
    //console.log("Search for " + searchInput);

    // Get request using search to get the Artist ID
    let searchParameters = {  //Spotify makes you request info in a certain way
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }
    }

    let artistID = await fetch(`https://api.spotify.com/v1/search?q=${searchInput}&type=artist`, searchParameters)
      .then(response => response.json())
      .then(data => {
        return data.artists.items[0].id;  //return a string because artistID variable will be updated with that value
      });

    //console.log("artistID is " + artistID);

    // Get request with artistID and grab all the albums from that artist
    let returnedAlbums = await fetch(`https://api.spotify.com/v1/artists/${artistID}/albums?include_groups=album&market=US&limit=50`, searchParameters)
      .then(response => response.json())
      .then(data => {
        //console.log(data.items);
        setAlbums(data.items);
      });

    // Display those albums (returned below)

    // Get request with artistID and grab all the artist's most popular songs
    let artistPopularSongs = await fetch(`https://api.spotify.com/v1/artists/${artistID}/top-tracks?market=US`, searchParameters)
      .then(response => response.json())
      .then(data => {
        //console.log(data.tracks);
      });
  }

  //console.log(albums);

  return (
    <div>
      <Container>
        <InputGroup className="searchBar" size="lg">
          <FormControl
            placeholder='Search for artist'
            type='input'
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                search();
              }
            }}
            onChange={e => setSearchInput(e.target.value)}
          />
          <Button onClick={search}>
            Search
          </Button>
        </InputGroup>
      </Container>

      <Container>
        <Row className="row row-cols-4">
          {/*.map is essentially looping through the albums array, but also gives access to individual objects (aka individual albums) and index within the array*/}
          {albums.map((album) => {
            //console.log(album);
            return (
              <div key={album.id} className="space">
                <Card className="center">
                  <Card.Img src={album.images[0].url} />
                  <Card.Body>
                    <Card.Title>{album.name}</Card.Title>
                    <Card.Text>Year Released: {album.release_date.slice(0, 4)}</Card.Text>
                    <Card.Text>Number of Songs: {album.total_tracks}</Card.Text>
                    <Card.Footer>Listen to the album <a href={album.external_urls.spotify}>here</a></Card.Footer>
                  </Card.Body>
                </Card>
              </div>
            )
          })}
        </Row>
      </Container>
    </div>
  );
}

export default App;