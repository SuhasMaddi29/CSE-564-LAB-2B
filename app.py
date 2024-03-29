from flask import Flask, jsonify, render_template, request
import pandas as pd
import numpy as np
from sklearn.manifold import MDS
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.cluster import KMeans

app = Flask(__name__, static_folder='static')

# Load your dataset
df = pd.read_csv('Updated_Selected_Loan_Data.csv')

# Separate features by type for preprocessing
numerical_features = df.select_dtypes(include=[np.number]).columns.tolist()
categorical_features = df.select_dtypes(exclude=[np.number]).columns.tolist()

# Define preprocessing for numerical columns (scale them)
numerical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='mean')),
    ('scaler', StandardScaler())])

# Preprocess and cluster without encoding categorical variables
df_numeric_only = df[numerical_features].copy()
df_numeric_only = numerical_transformer.fit_transform(df_numeric_only)
kmeans = KMeans(n_clusters=4, random_state=42)
df['cluster'] = kmeans.fit_predict(df_numeric_only)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data/kmeans-mse')
def kmeans_mse():
    max_clusters = 10
    mse_values = []
    for k in range(1, max_clusters + 1):
        kmeans = KMeans(n_clusters=k, random_state=42).fit(df_numeric_only)
        mse = kmeans.inertia_  # Sum of squared distances of samples to their closest cluster center
        mse_values.append({'clusters': k, 'mse': mse})
    return jsonify(mse_values)

@app.route('/data/mds-points')
def mds_points():
    num_clusters = request.args.get('clusters', default=4, type=int)
    kmeans = KMeans(n_clusters=num_clusters, random_state=42).fit(df_numeric_only)
    df['cluster'] = kmeans.labels_
    mds = MDS(n_components=2, random_state=42)
    mds_coords = mds.fit_transform(df_numeric_only)
    data = [{'x': x, 'y': y, 'cluster': cluster} for (x, y), cluster in zip(mds_coords, df['cluster'])]
    return jsonify(data)

# Function to serve MDS variables data
@app.route('/data/mds-variables')
def mds_variables():
    # Only numerical features for MDS of variables
    numerical_data = df[numerical_features]
    df_scaled = numerical_transformer.fit_transform(numerical_data)
    correlations = np.corrcoef(df_scaled, rowvar=False)
    dissimilarities = 1 - np.abs(correlations)
    mds = MDS(n_components=2, dissimilarity='precomputed', random_state=42)
    mds_coords = mds.fit_transform(dissimilarities)
    data = [{'variable': var, 'x': float(x), 'y': float(y)} for var, (x, y) in zip(numerical_features, mds_coords)]
    return jsonify(data)

@app.route('/data/pcp-data')
def pcp_data():
    # Using only numerical data and the 'cluster' column for PCP
    num_clusters = request.args.get('clusters', default=4, type=int)
    kmeans = KMeans(n_clusters=num_clusters, random_state=42).fit(df_numeric_only)
    df['cluster'] = kmeans.labels_
    numerical_data_with_cluster = df[numerical_features + ['cluster']].copy()
    # Convert DataFrame to a list of dictionaries for JSON response
    data = numerical_data_with_cluster.to_dict('records')
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
