import React, {useState, useEffect} from "react";
import {ProjectList} from "../projectCard"
import { SponsoredProjectsCarousel } from "../sponsoredProjects";
import Loader from "../utils/loader";

import { firestoreGetAllProjectsAction, firestoreGetSponsoredProjectsAction } from "../../utils/firebase";


const Home = () => {

    const [projectList, setProjectList] = useState([]);
    const [sponsoredList, setSponsoredList] = useState([]);
    const [loading, setLoading] = useState(false);

    const address = window.sessionStorage.getItem("address")


    const getProjects = async () => {
        setLoading(true);
        firestoreGetAllProjectsAction()
            .then(projects => {
                if (projects) {
                    setProjectList(projects);
                }
            })
            .catch(error => {
                console.log(error);
            })
            .finally(_ => {
                setLoading(false);
            });
    };

    useEffect(() => {
        getProjects();
    }, []);

    useEffect(() => {
        const getSponsoredProjects = async () => {
            setLoading(true);
            firestoreGetSponsoredProjectsAction().then(
                projects => setSponsoredList(projects)).catch(
                    error => console.log(error)
                ).finally(_ => setLoading(false));
        }
        
        getSponsoredProjects();
    },[]);

    return (
    <div>
        {loading ? (
           <Loader/>
        ): (
        <div>
        <SponsoredProjectsCarousel projectList={sponsoredList}/>
        <br/>
        <hr/>
        <ProjectList projects={projectList} address={address}/>
        </div>
        )}
    </div>
    )
}

export default Home;