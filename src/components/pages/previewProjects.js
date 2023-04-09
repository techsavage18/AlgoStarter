import React, { useState, useEffect } from 'react';
import { firestoreGetAllProjectsAction } from "../../utils/firebase";
import {ProjectListNotLoggedIn} from "../projectCard"
import Loader from "../utils/loader";


const PreviewProjects = () => {
    const [projectList, setProjectList] = useState([]);
    const [loading, setLoading] = useState(false);

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

    return (
        <div className='min-vh-100' style={{backgroundColor: "#263238"}}>
            {loading ? (
               <Loader/>
            ): (
            <div>
            <ProjectListNotLoggedIn projects={projectList}/>
            </div>
            )}
        </div>
        )
    
} 

export default PreviewProjects;