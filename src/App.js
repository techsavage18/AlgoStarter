import React, {useEffect, useState} from "react";
import LandingPage from "./components/pages/landingPage";
import './App.css';
import Wallet from "./components/utils/wallet";
import {Container, Nav} from "react-bootstrap";
import HeaderWithNav from "./components/header";
import {Footer} from "./components/footer";
import Routes from './components/utils/routes'


import { HashRouter } from "react-router-dom";
import { toast , Toaster} from "react-hot-toast";
import {indexerClient} from "./utils/constants";
import coverImg from "./assets/img/landing_page.png"


const App = function AppWrapper() {
    const [balance, setBalance] = useState(0);
    const [address, setAddress] = useState("");

    const fetchBalance = async (accountAddress) => {
        indexerClient.lookupAccountByID(accountAddress).do()
            .then(response => {
                const _balance = response.account.amount;
                setBalance(_balance);
            })
            .catch(error => {
                console.log(error);
            });
    };

    const connectWallet = async () => {
        if (typeof window.AlgoSigner !== "undefined") {
            window.AlgoSigner.connect()
                .then(_ => {
                    console.log('Successfully logged in to AlgoSigner')
                    window.AlgoSigner.accounts({
                    ledger: 'TestNet'
                    }).then((accounts) => {
                        console.log('Successfully collected testNet accounts');
                        const _account = accounts[0];
                        sessionStorage.setItem("address", _account.address);
                        setAddress(_account.address);
                        fetchBalance(_account.address);
                        console.log(_account)
                })}).catch(error => {
                console.log('Could not connect to MyAlgo wallet');
                console.error(error);
                })
            } else {
                toast.error("Install the AlgoSigner extension to use this app", {
                    position: 'bottom-center'
                });
            }
    };

    useEffect(() => {
        if (sessionStorage.getItem("address")) setAddress(sessionStorage.getItem("address"))
        fetchBalance(window.sessionStorage.getItem("address"))
    },[]);

    const disconnect = () => {
        setAddress("");
        window.sessionStorage.setItem("address", "");
        setBalance(null);
    };

    return (
        <>
            <Toaster />
            <HashRouter>
            {address.length > 0 && (window.sessionStorage.getItem("address").length > 0) ? (
                <div style={{backgroundColor: "#263238",   minHeight: "100vh"}}>
                <HeaderWithNav/>
                <Container fluid="md">
                    <Nav className="justify-content-end pt-3 pb-0" style={{position: 'flex'}}>
                        <Nav.Item>
                            <Wallet
                                address={window.sessionStorage.getItem("address")}
                                amount={balance}
                                disconnect={disconnect}
                                symbol={"ALGO"}
                            />
                        </Nav.Item>
                    </Nav>
                    <Routes/>
                </Container>
                
                <Footer/>
                </div>
            ) : (
                <div>
                <LandingPage name={"AlgoStarter"} mainImg={coverImg} connect={connectWallet}/>
                </div>
            )}
            </HashRouter>
        </>
    );
}

export default App
