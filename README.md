# UrbanFACET: Visually Profiling Cities from Mobile Device Recorded Movement Data of Millions of City Residents


This is the codes repository of UrbanFACET, includes data cleaning and entropy calucaltion scripts, as well as system implements and front-end web parts.

## Abstract

Cities are living systems where urban infrastructures and their functions are defined and evolved due to population behaviors. Profiling the cities and functional regions has been an important topic in urban design and planning. This paper studies a unique big data set which includes daily movement data of tens of millions of city residents, and develop a visual analytics system, namely UrbanFACET, to discover and visualize the dynamical profiles of multiple cities and their residents. This big user movement data set, acquired from mobile users' agnostic check-ins at thousands of phone APPs, is well utilized in an integrative study and visualization together with urban structure (e.g., road network) and POI (Point of Interest) distributions. In particular, we novelly develop a set of information-theory based metrics to characterize the mobility patterns of city areas and groups of residents. These multifaceted metrics including Fluidity, vibrAncy, Commutation, divErsity, and densiTy (FACET) which categorize and manifest hidden urban functions and behaviors. UrbanFACET system further allows users to visually analyze and compare the metrics over different areas and cities in metropolitan scales. The system is evaluated through both case studies on several big and heavily populated cities, and user studies involving real-world users.

## Repository Structure

All data analyzing scripts and configuration files are put in `server` folder, `app.js` is the sytem entrance file, `package.json` defines the application and its dependency. Developed in Node.js with `Express` framework. Visualize data with `D3.js`, `leaflet.js` and pure `<canvas>` manipulations.

## Installation

```
# replace repo-url with actual address
git clone repo-url 
cd UrbanFACET

npm install
npm run start
```

## Documents

[中文 Wiki](./WIKI.md)

## Dependency

The `semantic` version used in this project is `^2.2.6`, complied file is stored in `/public/js/lib/` folder.

## Contact

* Github - [ISCAS_VIS](https://github.com/visdata)

## LICENSE

GNU General Public License v3.0
