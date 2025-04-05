import re
def clean_and_parse_json_string(response_text: str):
    # Remove markdown-style code block if present
    cleaned = re.sub(r"^```(?:\w+)?\n?", "", response_text.strip())  # removes ```python\n or ```
    cleaned = re.sub(r"\n?```$", "", cleaned)  # removes ending ```
    return cleaned