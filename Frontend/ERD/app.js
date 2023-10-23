const $ = go.GraphObject.make;
let myDiagram;

function init() {
    myDiagram = $(go.Diagram, "myDiagramDiv", {
        allowDelete: false,
        allowCopy: false,
        "undoManager.isEnabled": true
    });

    myDiagram.nodeTemplate =
    $(go.Node, "Auto",
        $(go.Shape, "RoundedRectangle",
            { fill: "lightyellow", stroke: "gray" }),
        $(go.Panel, "Vertical",
            $(go.TextBlock, 
                { margin: new go.Margin(4, 2), font: "bold 14px sans-serif" },
                new go.Binding("text", "key")),
            $(go.Shape, "LineH",
                { width: 150, height: 0, strokeWidth: 2, stroke: "gray", margin: new go.Margin(0, 0, 5, 0) }),
            $(go.Panel, "Vertical",
                new go.Binding("itemArray", "items"),
                {
                    itemTemplate:
                    $(go.Panel, "Horizontal",
                        $(go.TextBlock,
                            { margin: 2, font: "12px sans-serif" },
                            new go.Binding("text", "", function(item) {
                                return item.name + " (" + item.type + ")"; 
                            })),
                        $(go.TextBlock,
                            { margin: 2, font: "10px sans-serif", opacity: 0.5, visible: false },
                            new go.Binding("visible", "iskey"),
                            new go.Binding("text", "", function(item) {
                                return item.iskey ? "PK" : "";
                            })),
                        $(go.TextBlock,
                            { margin: 2, font: "10px sans-serif", opacity: 0.5, visible: false },
                            new go.Binding("visible", "isForeignKey"),
                            new go.Binding("text", "", function(item) {
                                return item.isForeignKey ? "FK" : "";
                            })),
                        $(go.Shape,
                            { width: 12, height: 12, margin: 2, visible: false },
                            new go.Binding("visible", "iskey"),
                            new go.Binding("figure", "figure"),
                            new go.Binding("fill", "color"))
                    )
                }
            )
        )
    );

    myDiagram.linkTemplate =
    $(go.Link,
        { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver, corner: 5 },
        $(go.Shape,
            {
                stroke: "gray",
                strokeWidth: 1,
                strokeDashArray: [4, 4]
            },
            new go.Binding("strokeWidth", "isPrimaryKey", function(isPK) {
                return isPK ? 2 : 1;
            })),
        $(go.Shape,
            {
                toArrow: "Standard",
                fill: "gray"
            }),
        $(go.TextBlock,
            {
                segmentIndex: 0,
                segmentOffset: new go.Point(NaN, NaN),
                segmentOrientation: go.Link.OrientUpright
            },
            new go.Binding("text", "text")),
        $(go.TextBlock,
            {
                segmentIndex: -1,
                segmentOffset: new go.Point(NaN, NaN),
                segmentOrientation: go.Link.OrientUpright
            },
            new go.Binding("text", "toText"))
    );

    fetchDataFromServer();
}

function fetchDataFromServer() {
    fetch('http://localhost:3000/sql/generateERD', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sql: "\nCREATE DATABASE IF NOT EXISTS kampus;\nUSE kampus;\n\nCREATE TABLE mahasiswa (\n  id_mahasiswa INTEGER PRIMARY KEY AUTO_INCREMENT,\n  nama VARCHAR(50) NOT NULL,\n  alamat VARCHAR(50) NOT NULL,\n  jurusan VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE dosen (\n  id INTEGER PRIMARY KEY AUTO_INCREMENT,\n  nama VARCHAR(50) NOT NULL,\n  alamat VARCHAR(50) NOT NULL,\n  jurusan VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE matakuliah (\n  id INTEGER PRIMARY KEY AUTO_INCREMENT,\n  nama VARCHAR(50) NOT NULL,\n  kode VARCHAR(50) NOT NULL,\n  sks INTEGER NOT NULL\n);\n\nCREATE TABLE kelas (\n  id INTEGER PRIMARY KEY AUTO_INCREMENT,\n  nama VARCHAR(50) NOT NULL,\n  kapasitas INTEGER NOT NULL\n);\n\nCREATE TABLE jadwal (\n  id INTEGER PRIMARY KEY AUTO_INCREMENT,\n  kelas_id INTEGER NOT NULL,\n  matakuliah_id INTEGER NOT NULL,\n  dosen_id INTEGER NOT NULL,\n  FOREIGN KEY (kelas_id) REFERENCES kelas (id),\n  FOREIGN KEY (matakuliah_id) REFERENCES matakuliah (id),\n  FOREIGN KEY (dosen_id) REFERENCES dosen (id)\n);\n\nCREATE TABLE nilai (\n  id INTEGER PRIMARY KEY AUTO_INCREMENT,\n  mahasiswa_id INTEGER NOT NULL,\n  matakuliah_id INTEGER NOT NULL,\n  nilai INTEGER NOT NULL,\n  FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa (id),\n  FOREIGN KEY (matakuliah_id) REFERENCES matakuliah (id)\n);\n    "
        })
    })
    .then(response => response.json())
    .then(data => {
        const transformedData = transformData(data);
        myDiagram.model = new go.GraphLinksModel(transformedData.tables, transformedData.relations);
    })
    .catch(error => console.error('Error fetching data:', error));
}

function transformData(data) {
    const nodeData = data.tables.map(table => {
        return {
            key: table.name,
            items: table.columns.map(col => {
                const isForeignKey = data.relations.some(rel => rel.fromTable === table.name && rel.fromColumn === col.name);
                return {
                    name: col.name,
                    iskey: col.name === table.primaryKey,
                    isForeignKey: isForeignKey,
                    type: col.type,
                    figure: col.type === 'INTEGER' ? 'Circle' : 'RoundedRectangle',
                    color: col.name === table.primaryKey ? 'purple' : (isForeignKey ? 'red' : 'blue')
                };
            })
        };
    });

    const linkData = data.relations.map(rel => {
        return {
            from: rel.fromTable,
            to: rel.toTable,
            text: "0..N",
            toText: "1"
        };
    });

    return {
        tables: nodeData,
        relations: linkData
    };
}


function buttonClick() {
    const myDiagramDiv = document.getElementById("myDiagramDiv");
    const button = document.getElementById("darkMode");
    myDiagramDiv.style["background-color"] = (button.innerHTML === "Dark Mode") ? "#242424" : "#ffffff";
    button.innerHTML = (button.innerHTML === "Dark Mode") ? "Light Mode" : "Dark Mode";
    colorSwitch();
}

function colorSwitch() {
    myDiagram.model.commit(m => {
        m.set(m.modelData, "darkMode", !m.modelData.darkMode);
    }, null);
}
function downloadImage() {
    const img = myDiagram.makeImageData({ scale: 1 });
    const a = document.createElement('a');
    a.href = img;
    a.download = 'ERD.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


window.addEventListener('DOMContentLoaded', init);
