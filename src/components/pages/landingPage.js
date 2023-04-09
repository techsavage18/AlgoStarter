import React, { useState } from 'react';
import {Button, Nav} from "react-bootstrap";
import PropTypes from 'prop-types';
import PreviewProjects from './previewProjects';
import { Footer } from '../footer';


const LandingPage = ({name, mainImg, connect}) => {

  const [showPreview, setShowPreview] = useState(false);

    return (
        !showPreview? (<div className="d-flex justify-content-center flex-column text-center min-vh-100" style={{backgroundColor: "#263238"}}>
            <div className="mt-auto text-light mb-5">
                <div
                    className="ratio ratio-1x1 mx-auto mb-2"
                    style={{maxWidth: "26vw"}}
                >
                    <img src={mainImg} alt=""/>
                </div>
                <h1 className='font-title'>{name}</h1>
                <h4 style={{fontSize: "18px"}}>Fund with your ideas!</h4>
                <p className='pt-3 mb-2 text-muted' style={{fontSize: "14px"}}>Please connect your wallet to continue.</p>
                <div className='d-flex justify-content-center'>
                <Button
                    onClick={() => connect()}
                    variant="outline-light"
                    className="rounded-pill px-3 mt-1 me-3"
                >
                    Connect Wallet
                </Button>
                <Button
                    onClick={() => setShowPreview(true)}
                    variant="outline-light"
                    className="rounded-pill px-3 mt-1"
                >
                    Explore Projects
                </Button>
                </div>
            </div>
            <p className="mt-auto text-danger"><small>Build on Algorand Hyderabad Hackathon</small></p>
        </div>) : (
            <div style={{backgroundColor: "#263238"}}>
                <Nav className="justify-content-end pt-3 pb-0 pe-5" style={{position: 'flex'}}>
                        <Nav.Item>
                        <Button
                            onClick={() => setShowPreview(false)}
                            variant="outline-light"
                            className="rounded-pill px-3 mt-1"
                        >
                            Back To Login
                        </Button>
                        </Nav.Item>
                    </Nav>
            <PreviewProjects />
            <br/>
            <Footer/>
            </div>
        )
    );
};

LandingPage.propTypes = {
    name: PropTypes.string,
    mainImg: PropTypes.string,
    connect: PropTypes.func
};

export default LandingPage;