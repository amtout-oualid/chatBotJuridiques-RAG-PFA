import os
import glob
from plantuml import PlantUML

def convert_puml_to_png():
    folder = r"C:\Users\pc\Desktop\RAG\chatBotJuridiques-RAG-PFA\UML_DB_Roots\UML_Staruml"
    server = PlantUML(url='http://www.plantuml.com/plantuml/img/')
    
    puml_files = glob.glob(os.path.join(folder, "*.puml"))
    for file in puml_files:
        png_file = file.replace(".puml", ".png")
        print(f"Converting {file} to PNG...")
        try:
            server.processes_file(file)
            print(f"✅ Saved to {png_file}")
        except Exception as e:
            print(f"❌ Failed to convert {file}: {e}")

if __name__ == "__main__":
    convert_puml_to_png()