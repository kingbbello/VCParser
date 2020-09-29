// //Get the parameters for all contentline
//     char *end_str;
//     char *token = strtok_r(part3, ";", &end_str);
//     while (token != NULL)
//     {
//         Parameter *param = malloc(sizeof(Parameter));
//         char *end_token;
//         char *token2 = strtok_r(token, "=", &end_token);
//         while (token2 != NULL)
//         {
//             param->name = malloc(strlen(token2) + 1);
//             strcpy(param->name, token2);
//             // printf("name = %s\n", param->name);

//             token2 = strtok_r(NULL, "=", &end_token);
//             param->value = malloc(strlen(token2) + 1);
//             strcpy(param->value, token2);
//             // printf("value = %s\n", param->value);
//             insertBack(prop->parameters, param);
//             break;
//         }

//         token = strtok_r(NULL, ";", &end_str);
//     }