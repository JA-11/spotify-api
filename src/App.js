import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, InputGroup, FormControl, Button, Row, Col, Card } from 'react-bootstrap';
import { useState, useEffect } from 'react';

const clientId = `${process.env.REACT_APP_CLIENT_ID}`; // Your client id
const clientSecret = `${process.env.REACT_APP_CLIENT_SECRET}`; // Your secret

function App() {

  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [albums, setAlbums] = useState([]);
  const [popularSongs, setPopularSongs] = useState([]);
  const [artist_ID, setArtist_ID] = useState("");
  const [artistPicture, setArtistPicture] = useState("");
  const [artistName, setartistName] = useState("");

  useEffect(() => {
    document.body.style.backgroundColor = "#121212";

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
        setArtist_ID(data.artists.items[0].id);
        setartistName(data.artists.items[0].name);
        //console.log(data.artists.items[0].images[0].url);
        setArtistPicture(data.artists.items[0].images[0].url);
        return data.artists.items[0].id;  //return a string because artistID variable will be updated with that value
      });

    //console.log("artistID is " + artistID);

    // Get request with artistID and grab all the albums from that artist
    let returnedAlbums = await fetch(`https://api.spotify.com/v1/artists/${artistID}/albums?include_groups=album&market=US&limit=50`, searchParameters)
      .then(response => response.json())
      .then(data => {

        //Filtering for duplicate albums (two copies were showing up for explict and clean versions)
        let filteredAlbums = data.items
          // store the comparison values in array
          .map(e => e['name'])
          // store the indexes of the unique objects
          .map((e, i, final) => final.indexOf(e) === i && i)
          // eliminate the false indexes & get unique objects
          .filter(obj => data.items[obj]).map(e => data.items[e]);

        //console.log(data.items);
        //console.log(filteredAlbums);
        setAlbums(filteredAlbums);
      });

    // Display those albums (returned below)

    // Get request with artistID and grab all the artist's most popular songs
    let artistPopularSongs = await fetch(`https://api.spotify.com/v1/artists/${artistID}/top-tracks?market=US`, searchParameters)
      .then(response => response.json())
      .then(data => {
        //console.log(data.tracks);
        setPopularSongs(data.tracks);
      });
  }

  //console.log(albums);
  //console.log(artistPicture);

  let displayPopularSongsTitle;
  if (popularSongs.length > 0) {
    displayPopularSongsTitle = <p className="center">Popular Songs:</p>;
  }

  //Added function with conditional for updating the header
  function updateHeader() {
    let header;
    if (artist_ID.length === 0) {
      header = "your favorite artist";
    } else {
      header = artistName;
    }
    return header;
  }

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
          <Button onClick={search} variant="success">
            Search
          </Button>
        </InputGroup>
      </Container>

      <Container className="white">
        <div className="songs">
          {displayPopularSongsTitle}
          <Row className="space">
            <Col md={{ span: 3, offset: 3 }}>
              {popularSongs.slice(0, 5).map(song => (
                <div key={song.id}>
                  <ul>
                    <li>{song.name}</li>
                  </ul>
                </div>
              ))}
            </Col>
            <Col md={{ span: 3 }}>
              {popularSongs.slice(5).map(song => (
                <div key={song.id}>
                  <ul>
                    <li>{song.name}</li>
                  </ul>
                </div>
              ))}
            </Col>
          </Row>
        </div>
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

        <div className="center">
          <br />
          <h2 className="white">Listen to {updateHeader()} right now!</h2>;
        </div>

        <img className="artistImage" src={artistPicture} alt="" />
      </Container>
    </div>
  );
}

export default App;