from typing import List, Tuple

JAVA_BASE_TYPES = {
    "Z": "boolean",
    "B": "byte",
    "C": "char",
    "S": "short",
    "I": "int",
    "J": "long",
    "F": "float",
    "D": "double",
    "V": "void",
}


# parse_obfuscated_signature will parse an obfuscated signatures into parameter
# and return types that can be then deobfuscated
def parse_obfuscated_signature(signature: str) -> Tuple[List[str], str]:
    if signature[0] != "(":
        return [], ""

    signature = signature[1:]
    parameter_types, return_type = signature.rsplit(")", 1)
    types = []
    i = 0
    arrays = 0

    while i < len(parameter_types):
        t = parameter_types[i]

        if t in JAVA_BASE_TYPES:
            start_index = i - arrays
            types.append(parameter_types[start_index : i + 1])
            arrays = 0
        elif t == "L":
            start_index = i - arrays
            end_index = parameter_types[i:].index(";")
            types.append(parameter_types[start_index : i + end_index + 1])
            arrays = 0
            i += end_index
        elif t == "[":
            arrays += 1
        else:
            arrays = 0

        i += 1

    return types, return_type


# format_signature formats the types into a human-readable signature
def format_signature(parameter_java_types: List[str], return_java_type: str) -> str:
    signature = f"({', '.join(parameter_java_types)})"
    if return_java_type and return_java_type != "void":
        signature += f": {return_java_type}"
    return signature


def byte_code_type_to_java_type(byte_code_type: str, mapper=None) -> str:
    if not byte_code_type:
        return ""

    token = byte_code_type[0]
    if token in JAVA_BASE_TYPES:
        return JAVA_BASE_TYPES[token]
    elif token == "L":
        # invalid signature
        if byte_code_type[-1] != ";":
            return byte_code_type
        obfuscated = byte_code_type[1:-1].replace("/", ".")
        if mapper:
            mapped = mapper.remap_class(obfuscated)
            if mapped:
                return mapped
        return obfuscated
    elif token == "[":
        return f"{byte_code_type_to_java_type(byte_code_type[1:], mapper)}[]"
    else:
        return byte_code_type


# map_obfucated_signature will parse then deobfuscated a signature and
# format it appropriately
def deobfuscate_signature(signature: str, mapper=None) -> str:
    if not signature:
        return ""

    parameter_types, return_type = parse_obfuscated_signature(signature)
    if not (parameter_types or return_type):
        return ""

    parameter_java_types = []
    for parameter_type in parameter_types:
        new_class = byte_code_type_to_java_type(parameter_type, mapper)
        parameter_java_types.append(new_class)

    return_java_type = byte_code_type_to_java_type(return_type, mapper)
    return format_signature(parameter_java_types, return_java_type)
