document.addEventListener('DOMContentLoaded', function() {
    // Parameters for the SVG canvas size and plot margins
    let margin = {top: 100, right: 150, bottom: 80, left: 80};

    // At the very top of your script
let globalWidth = 960 - margin.left - margin.right;
let globalHeight = 500 - margin.top - margin.bottom;

let selectedPoints = [];

let k;


// Then, inside your createSvgWithTitles or before creating SVGs,
// use globalWidth and globalHeight to set the dimensions.

// Example of adjusting before creating an SVG
function adjustDimensionsForContainer(containerId) {
    if (containerId === "#pcp-all") {
        globalWidth = 1200 - margin.left - margin.right;
        globalHeight = 720 - margin.top - margin.bottom;
    } else {
        globalWidth = 960 - margin.left - margin.right;
        globalHeight = 500 - margin.top - margin.bottom;
    }
}

    // Function to create an SVG element with titles and axes
    function createSvgWithTitles(containerId, titleText, xAxisTitle, yAxisTitle) {

        let svg = d3.select(containerId).append('svg')
            .attr('width', globalWidth + margin.left + margin.right)
            .attr('height', globalHeight + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Main title
        svg.append('text')
           .attr('x', globalWidth / 2)
           .attr('y', 0 - (margin.top / 2))
           .attr('text-anchor', 'middle')
           .style('font-size', '24px')
           .text(titleText);

        // X-axis title
        svg.append('text')
           .attr('x', globalWidth / 2)
           .attr('y', globalHeight + 40)
           .attr('text-anchor', 'middle')
           .style('font-size', '16px')
           .text(xAxisTitle);

        // Y-axis title
        svg.append('text')
           .attr('transform', 'rotate(-90)')
           .attr('y', 0 - margin.left)
           .attr('x', 0 - (globalHeight / 2))
           .attr('dy', '1em')
           .attr('text-anchor', 'middle')
           .style('font-size', '16px')
           .text(yAxisTitle);

        return svg;
    }

    // Create SVG for data points with titles and axes
    adjustDimensionsForContainer('#mds-points');
    let svgDataPoints = createSvgWithTitles('#mds-points', 'Data Points MDS Plot', 'X Coordinate', 'Y Coordinate');
    
    // Create SVG for variables with titles and axes
    adjustDimensionsForContainer('#mds-variables');
    let svgVariables = createSvgWithTitles('#mds-variables', 'Variables MDS Plot', 'X Coordinate', 'Y Coordinate');

    svgVariables.append('defs').append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 5)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', 'blue');


    adjustDimensionsForContainer('#pcp-all');
    let pcpSvg = createSvgWithTitles('#pcp-all', 'PCP Plot - Numerical & Categorical', '', '');

    // Scales, axes, and color scale setup for Data Points
    adjustDimensionsForContainer('#mds-points');
    let xScaleDataPoints = d3.scaleLinear().range([0, globalWidth]),
          yScaleDataPoints = d3.scaleLinear().range([globalHeight, 0]),
          xAxisDataPoints = d3.axisBottom(xScaleDataPoints),
          yAxisDataPoints = d3.axisLeft(yScaleDataPoints),
          colorScale = d3.scaleOrdinal(d3.schemeCategory10);

          adjustDimensionsForContainer('#mds-variables');
    // Scales and axes setup for Variables
    let xScaleVariables = d3.scaleLinear().range([0, globalWidth]),
          yScaleVariables = d3.scaleLinear().range([globalHeight, 0]),
          xAxisVariables = d3.axisBottom(xScaleVariables),
          yAxisVariables = d3.axisLeft(yScaleVariables);

    // Function to draw points and labels on the given SVG element
    function drawPointsAndLabels(svg, data, xScale, yScale, xAxis, yAxis, colorScale) {

        // Update the domains
        xScale.domain(d3.extent(data, d => d.x)).nice();
        yScale.domain(d3.extent(data, d => d.y)).nice();

        // Draw the axes
        svg.append('g')
           .attr('class', 'x axis')
           .attr('transform', `translate(0,${globalHeight})`)
           .call(xAxis);

        svg.append('g')
           .attr('class', 'y axis')
           .call(yAxis);

        let points;

        if(svg===svgVariables) {
            points = svg.selectAll('.point')
            .data(data)
            .enter().append('circle')
            .attr('class', 'point')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 8)
            .style('fill', d => colorScale ? colorScale(d.cluster) : 'black')
            .on('click', function(event, d) {
                // Check if this point is already selected
                let index = selectedPoints.findIndex(p => p.x === d.x && p.y === d.y);
                if (index === -1) {
                    // Not found, add to selectedPoints
                    selectedPoints.push(d);
                    d3.select(this).style('fill', 'red'); // Highlight selected point
                    console.log(selectedPoints);
                } else {
                    // Found, remove from selectedPoints
                    selectedPoints.splice(index, 1);
                    d3.select(this).style('fill', 'black'); // Revert to default color
                    console.log(selectedPoints);
                }
                updatePath(xScaleVariables, yScaleVariables); // Redraw path with updated selectedPoints
                updatePCPBasedOnSelection(k);
            });
        }
        else{
        // Draw the points
        points = svg.selectAll('.point')
                        .data(data)
                        .enter().append('circle')
                        .attr('class', 'point')
                        .attr('cx', d => xScale(d.x))
                        .attr('cy', d => yScale(d.y))
                        .attr('r', 5)
                        .style('fill', d => colorScale ? colorScale(d.cluster) : 'black');
        }
 


        // Draw labels if variable plot
        if (!colorScale) {
            let labels = svg.selectAll('.label')
                            .data(data)
                            .enter().append('text')
                            .attr('class', 'label')
                            .attr('x', d => xScale(d.x))
                            .attr('y', d => yScale(d.y))
                            .style('text-anchor', 'start')
                            .text(d => d.variable)
                            .style('fill', 'black');

            // Prevent label overlap using d3.forceSimulation if necessary
            // (d3-force may be used to adjust label positions to reduce overlap)
            // Example of applying force simulation for labels:
            let simulation = d3.forceSimulation(data)
                .force('x', d3.forceX(d => xScale(d.x)).strength(0.99))
                .force('y', d3.forceY(d => yScale(d.y)).strength(0.99))
                .force('collide', d3.forceCollide().radius(4))
                .stop();

            for (let i = 0; i < 120; ++i) simulation.tick(); // Run simulation to prevent overlap

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        }
        

        return points;
    }

    // Function to add a legend to the plot
    function addLegend(svg, colorScale) {
        // Correctly select and remove any existing legends
        svg.selectAll('.legend').remove();
    
        let legend = svg.append('g')
                        .attr('class', 'legend')
                        .attr('transform', `translate(${globalWidth + 20}, 20)`); // Adjust translation as needed for visibility
    
        colorScale.domain().forEach((d, i) => {
            let legendRow = legend.append('g')
                                  .attr('transform', `translate(0, ${i * 20})`);
            legendRow.append('rect')
                     .attr('x', 0) // Adjusted for better positioning
                     .attr('width', 18)
                     .attr('height', 18)
                     .attr('fill', colorScale(d));
            legendRow.append('text')
                     .attr('x', 22) // Adjusted spacing between the rectangle and text
                     .attr('y', 9)
                     .attr('dy', '.35em')
                     .style('text-anchor', 'start')
                     .text(`Cluster ${d + 1}`);
        });
    }
    

    
function drawKMeansMSEPlot() {
    const mseSvgWidth = 960 - margin.left - margin.right, mseSvgHeight = 500 - margin.top - margin.bottom; // Adjust size as needed
    const svg = d3.select("#kmeans-mse").append("svg")
                  .attr("width", mseSvgWidth + margin.left + margin.right)
                  .attr("height", mseSvgHeight + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", `translate(${margin.left},${margin.top})`);

    fetch('/data/kmeans-mse')
        .then(response => response.json())
        .then(data => {
            // Set up scales
            const x = d3.scaleBand()
                .range([0, mseSvgWidth])
                .padding(0.1)
                .domain(data.map(d => d.clusters));
            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.mse)])
                .range([mseSvgHeight, 0]);
            
            // Add X axis
            svg.append("g")
               .attr("transform", `translate(0,${mseSvgHeight})`)
               .call(d3.axisBottom(x));

            // Add Y axis
            svg.append("g")
               .call(d3.axisLeft(y));

            // Bars
            svg.selectAll("mybar")
               .data(data)
               .enter()
               .append("rect")
               .attr("x", d => x(d.clusters))
               .attr("y", d => y(d.mse))
               .attr("width", x.bandwidth())
               .attr("height", d => mseSvgHeight - y(d.mse))
               .attr("fill", "#69b3a2")
               .on("click", function(event, d) {
                // Ensure the cluster number is correctly passed
                drawMDSPlot(d.clusters);
                updatePCPBasedOnSelection(d.clusters);
                k=d.clusters;
            });

            svg.append('text')
            .attr('x', mseSvgWidth / 2)
            .attr('y', 0 - (margin.top / 2))
            .attr('text-anchor', 'middle')
            .style('font-size', '24px')
            .text("K Means Plot");
 
         // X-axis title
         svg.append('text')
            .attr('x', mseSvgWidth / 2)
            .attr('y', mseSvgHeight + 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .text("Number of Clusters");
 
         // Y-axis title
         svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left + 10)
            .attr('x', 0 - (mseSvgHeight / 2) )
            .attr('dy', '1em')
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .text("Mean Squared Error");
        });
}
    
function drawMDSPlot(numClusters) { // Default to 4 clusters if not specified

    svgDataPoints.selectAll("*").remove(); // Clear previous MDS plot

    fetch(`/data/mds-points?clusters=${numClusters}`)
        .then(response => response.json())
        .then(data => {
            adjustDimensionsForContainer("mds-points");

            drawPointsAndLabels(svgDataPoints, data, xScaleDataPoints, yScaleDataPoints, xAxisDataPoints, yAxisDataPoints, colorScale);
            addLegend(svgDataPoints, colorScale);

            svgDataPoints.append('text')
            .attr('x', globalWidth / 2)
            .attr('y', 0 - (margin.top / 2))
            .attr('text-anchor', 'middle')
            .style('font-size', '24px')
            .text("MDS Numerical Plot");
 
         // X-axis title
         svgDataPoints.append('text')
            .attr('x', globalWidth / 2)
            .attr('y', globalHeight + 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .text("X Coordinate");
 
         // Y-axis title
         svgDataPoints.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (globalHeight / 2))
            .attr('dy', '1em')
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .text("Y Coordinate");
        });
}


    // // Fetch and draw data points with a legend for the data points MDS plot
    // fetch('/data/mds-points')
    //     .then(response => response.json())
    //     .then(data => {
    //         adjustDimensionsForContainer("mds-points");

    //         drawPointsAndLabels(svgDataPoints, data, xScaleDataPoints, yScaleDataPoints, xAxisDataPoints, yAxisDataPoints, colorScale);
    //         addLegend(svgDataPoints, colorScale);
    //     });

    drawKMeansMSEPlot();
    drawMDSPlot();

    // Fetch and draw variables with non-overlapping labels for the variables MDS plot
    fetch('/data/mds-variables')
        .then(response => response.json())
        .then(data => {
            adjustDimensionsForContainer("mds-variables");
            drawPointsAndLabels(svgVariables, data, xScaleVariables, yScaleVariables, xAxisVariables, yAxisVariables, null);
        });

    function updatePath(xScaleVariables, yScaleVariables) {
        adjustDimensionsForContainer('#mds-variables');
    
        // Remove existing lines and markers
        svgVariables.selectAll('line.selection').remove();
    
        // Check if there are at least two points to connect
        if (selectedPoints.length > 1) {
            for (let i = 0; i < selectedPoints.length - 1; i++) {
                // Draw a line between each pair of points
                svgVariables.append('line')
                    .attr('class', 'selection')
                    .attr('x1', selectedPoints[i].x)
                    .attr('y1', selectedPoints[i].y)
                    .attr('x2', selectedPoints[i + 1].x)
                    .attr('y2', selectedPoints[i + 1].y)
                    .attr('stroke', 'blue')
                    .attr('stroke-width', 2)
                    .attr('marker-end', 'url(#arrow)'); // Use the arrow marker
            }
        }
    }
    

    updatePCPBasedOnSelection();

    adjustDimensionsForContainer('#pcp-all');
    addLegend(pcpSvg, colorScale);

function updatePCPBasedOnSelection(numClusters) {
    pcpSvg.selectAll("*").remove();

    fetch(`/data/pcp-data?clusters=${numClusters}`)
    .then(response => response.json())
    .then(data => {
        let dimensions;
        if (selectedPoints.length > 1) {
            data = data.map(d => {
            let newData = {};
            selectedPoints.forEach(point => {
                // Ensure you're accessing the dimension name correctly
                // For example, if the dimension name is stored in a property named 'variable'
                let dimName = point.variable; // Correctly access the dimension name
                newData[dimName] = d[dimName];
                newData['cluster'] = d['cluster'];
            });
            return newData;
        });

        // Ensure the dimensions array is correctly populated with strings
        dimensions = selectedPoints.map(point => point.variable); // This should be an array of strings
        }

        adjustDimensionsForContainer('#pcp-all');
        
        if(dimensions==null){
            dimensions = Object.keys(data[0]).filter(d => d !== "cluster");
        }

        let fixedPositions = dimensions.map((_, i) => i * (globalWidth / (dimensions.length - 1))); // Evenly distribute positions

        let processedData = preprocessData(data, dimensions);

        let clusterIds = processedData.map(d => d.cluster).filter((v, i, a) => a.indexOf(v) === i);
        colorScale.domain(clusterIds);

        let dragging = {};

        // Scale for dimension names
        let x = d3.scalePoint()
                    .domain(dimensions)
                    .range([0, globalWidth])
                    .padding(1);

        // Scales for each dimension's values
        let yScales = dimensions.reduce((acc, dim) => {
            acc[dim] = d3.scaleLinear()
                        .domain(d3.extent(data, d => +d[dim]))
                        .range([globalHeight, 0]);
            return acc;
        }, {});

        let path = d => {
            return d3.line()(
                dimensions.map(p => {
                    // Additional check to ensure the property exists on the object
                    if (!d.hasOwnProperty(p) || d[p] == null) {
                        return null; // Skip drawing this segment
                    }
                    return [x(p), yScales[p](d[p])];
                }).filter(point => point != null) // Filter out any segments that were skipped
            );
        };
    

        // Draw the lines
        pcpSvg.selectAll("myPath")
            .data(processedData)
            .enter().append("path")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", d => d3.schemeCategory10[d.cluster % 10])
            .style("opacity", 0.5);

        // Drag event handlers
        function dragstarted(event, d) {
            dragging[d] = x(d);
            d3.select(this).raise();
        }

        function dragged(event, d) {
            // Find the nearest fixed position
            let dx = event.x,
                nearest = fixedPositions.reduce((prev, curr) => (Math.abs(curr - dx) < Math.abs(prev - dx) ? curr : prev));
            
            dragging[d] = nearest;
            dimensions.sort((a, b) => position(a) - position(b));
            x.domain(dimensions);
            
            pcpSvg.selectAll(".axis").attr("transform", d => `translate(${position(d)})`);
            pcpSvg.selectAll("path").attr("d", path);
        }

        function dragended(event, d) {
            delete dragging[d];
            d3.select(this).transition().duration(500).attr("transform", `translate(${x(d)})`);
            pcpSvg.selectAll("path").transition().duration(500).attr("d", path);

            updateAxisLabels(dimensions);
        }

        function position(dimension) {
            // Calculate the new position for a dragged dimension
            return dragging[dimension] === undefined ? x(dimension) : dragging[dimension];
        }

        // Add and draw the axis for each dimension
        pcpSvg.selectAll(".axis")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "axis")
        .attr("transform", d => `translate(${x(d)})`)
        .each(function(d) { 
            d3.select(this).call(d3.axisLeft(yScales[d]));
        })
        .selectAll('.domain') // Select the domain path of the axis, which is the main line
        .style('stroke-width', '4px');

        updateAxisLabels(dimensions);
    
  
        // Bind the drag behaviors to the axes
        pcpSvg.selectAll(".axis")
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

        pcpSvg.append('text')
            .attr('x', globalWidth / 2)
            .attr('y', 0 - (margin.top / 2))
            .attr('text-anchor', 'middle')
            .style('font-size', '24px')
            .text("Parallel Coordinates Plot");
        
        addLegend(pcpSvg, colorScale);
 
        function updateAxisLabels(dimensions) {
            // Calculate the index based on sorted dimensions for alternating positions
            let sortedIndices = dimensions.map(d => x.domain().indexOf(d));
        
            pcpSvg.selectAll(".axis-title").remove(); // Remove existing labels to prevent duplication
        
            pcpSvg.selectAll(".axis")
                .each(function(d, i) {
                    let index = sortedIndices[i];
                    let yPos = index % 2 == 0 ? -20 : globalHeight + 20; // Alternate position
        
                    d3.select(this).append("text")
                        .attr("class", "axis-title")
                        .attr("transform", `translate(0,${yPos})`)
                        .attr("y", 0)
                        .attr("dy", index % 2 == 0 ? "0em" : "1.2em")
                        .style("text-anchor", "middle")
                        .style("fill", "black")
                        .style("font-size", "10px")
                        .text(d);
                });
        }
    });
}

function preprocessData(data, dimensions) {
    console.log("Preprocessing data...");
    data.forEach(d => {
        dimensions.forEach(dim => {
            if (d[dim] === undefined || d[dim] === null) {
                console.log(`Missing data for dimension '${dim}', filling with 0.`);
                d[dim] = 0; // Default value for missing data; adjust as needed
            }
        });
    });
    return data;
}


    });
                
