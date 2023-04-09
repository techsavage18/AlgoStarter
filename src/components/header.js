import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { MDBIcon } from 'mdb-react-ui-kit';

import Routes from "./utils/routes";
import { LinkContainer } from "react-router-bootstrap";

function HeaderWithNav() {
  return (
    <div>
    <Navbar variant="dark" expand="lg" className='shadow-3-strong'>
        <Container fluid>
        <LinkContainer to="/">
          <Navbar.Brand href="/home">
            <img
                alt=""
                src="logo.svg"
                width="50"
                height="50"
                className="d-inline-block align-top"
              />{' '}
              AlgoStarter</Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="navbarScroll"> <MDBIcon icon='bars' fas /></Navbar.Toggle>
          <Navbar.Collapse id="navbarScroll"  className="justify-content-end">
          <Nav defaultActiveKey={window.location.pathname}>
          <LinkContainer to="/home">
            <Nav.Item className="pe-4">
            <Nav.Link href="/home">Explore Projects</Nav.Link>
            </Nav.Item>
            </LinkContainer>
            <LinkContainer to="/create-project">
            <Nav.Item className="pe-4">
            <Nav.Link href="/create-project">Create Crowdfunding</Nav.Link>
            </Nav.Item>
            </LinkContainer>
            <LinkContainer to="/profile">
            <Nav.Item className="pe-5">
            <Nav.Link href="/profile">Profile</Nav.Link>
            </Nav.Item>
            </LinkContainer>
          </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      </div>
  );
}

export default HeaderWithNav;