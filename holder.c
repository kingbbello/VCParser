#include <stdbool.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include "VCParser.h"

char *readFile(char *fileName)
{
    char *txt;

    FILE *fptr = NULL;
    fptr = fopen(fileName, "r");
    if (fptr == NULL)
    {
        perror("Error opening file!");
        return NULL;
    }

    fseek(fptr, 0, SEEK_END);
    int length = ftell(fptr);
    fseek(fptr, 0, SEEK_SET);
    txt = malloc(length);
    if (txt)
    {
        fread(txt, 1, length, fptr);
    }
    fclose(fptr);
    for (int i = 0; i < length - 2; i++)
    {
        if (txt[i] == '\n' && txt[i + 1] == ' ')
        {
            memmove(&txt[i], &txt[i + 1], length - i);
            memmove(&txt[i - 1], &txt[i], length - i - 1);
            length -= 2;
        }
    }
    txt[length] = '\0';
    return txt;
}

char *trim(char *str)
{
    int i;
    const char *seps = "\t\n\v\f\r ";

    i = strlen(str) - 1;
    while (i >= 0 && strchr(seps, str[i]) != NULL)
    {
        str[i] = '\0';
        i--;
    }
    return str;
}

char *substring(char *string, int start, int end)
{
    int len = end - start + 2;
    char *sub = malloc(len);
    int count = 0;
    for (int i = start; i <= end; i++)
    {
        sub[count] = string[i];
        count++;
    }
    sub[len - 1] = '\0';
    return trim(sub);
}

int curProcess(char *mini)
{
    if (strcmp(mini, "BEGIN:VCARD") == 0)
    {
        return 1;
    }
    else if (strcmp(mini, "END:VCARD") == 0)
    {
        return 2;
    }
    else
    {
        return 0;
    }
}

int count(char *text, char *toFind)
{
    int start = 0;
    int count = 0;
    for (int i = 0; i < strlen(text); i++)
    {
        if (text[i] == '\n' || text[i + 1] == '\0')
        {
            char *mini = substring(text, start, i);
            if (strcmp(mini, toFind) == 0)
            {
                count++;
            }
            // processMini(theCard, mini);
            start = i + 1;
            free(mini);
        }
    }
    return count;
}
//Takes a line from VCF and puts puts the appropriate date-time or Property into the Card
void processMini(Card *thecard, char *mini)
{
}

VCardErrorCode createCard(char *fileName, Card **newCardObject)
{

    if (fileName == NULL)
    {
        fprintf(stderr, "No file entered! Exiting...\n");
        return INV_FILE;
    }
    char *text = readFile(fileName);
    newCardObject = malloc(sizeof(Card) * count(text, "BEGIN:VCARD"));

    int start = 0;
    int cardCount = 0;
    Card *theCard;
    for (int i = 0; i < strlen(text); i++)
    {
        if (text[i] == '\n' || text[i + 1] == '\0')
        {
            char *mini = substring(text, start, i);
            int seen = curProcess(mini);

            if (seen == 1)
            {
                cardCount++;
                // printf("Beginning card item \n");
                theCard = malloc(sizeof(Card));
            }
            else if (seen == 2)
            {
                // printf("One card done! \n");
                *newCardObject = theCard;
                newCardObject++;
            }
            else
            {
                // printf("Card processing card \n");
                processMini(theCard, mini);
            }

            // processMini(theCard, mini);
            start = i + 1;
            free(mini);
        }
    }

    free(text);
    return OK;
}

void deleteCard(Card *obj)
{
}

char *cardToString(const Card *obj)
{

    return NULL;
}

char *errorToString(VCardErrorCode err)
{
    char *ERRORSTRING[] = {"OK", "INV_FILE", "INV_CARD", "INV_PROP", "INV_DT", "WRITE_ERROR", "OTHER_ERROR"};
    return ERRORSTRING[err];
}

// *************************************************************************

// ************* List helper functions - MUST be implemented ***************
void deleteProperty(void *toBeDeleted)
{
}

int compareProperties(const void *first, const void *second)
{
    return 0;
}

char *propertyToString(void *prop)
{
    return NULL;
}

void deleteParameter(void *toBeDeleted)
{
}

int compareParameters(const void *first, const void *second)
{
    return 0;
}

char *parameterToString(void *param)
{
    return NULL;
}

void deleteValue(void *toBeDeleted)
{
}

int compareValues(const void *first, const void *second)
{
    return 0;
}

char *valueToString(void *val)
{
    return NULL;
}

void deleteDate(void *toBeDeleted)
{
}

int compareDates(const void *first, const void *second)
{
    return 0;
}

char *dateToString(void *date)
{
    return NULL;
}

int main()
{
    Card **theCard = NULL;
    createCard("testCard.vcf", theCard);
    return 0;
}