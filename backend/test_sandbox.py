import sys
sys.path.insert(0, '.')
from sandbox import execute_pandas_code

code = """
df = pd.read_csv('current_data.csv')
male_count = df[df['gender'] == 'Male'].shape[0]
print(f'There are {male_count} males in the dataset.')
"""

ok, result, chart, err = execute_pandas_code(code, 'current_data.csv')
print('Success:', ok)
print('Result:', result)
if err:
    print('Error:', err)
