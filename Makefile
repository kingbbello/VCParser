UNAME := $(shell uname)
CC = gcc
CFLAGS = -Wall -std=c11 -g
LDFLAGS= -L.

all: VCParser

VCParser: VCParser.o 
	$(CC) $(CFLAGS) $(LDFLAGS) -o VCParser VCParser.o  

VCParser.o: VCParser.c VCParser.h 
	$(CC) $(CFLAGS) -c VCParser.c 

liblist.so: LinkedListAPI.o
	$(CC) -shared -o liblist.so LinkedListAPI.o

LinkedListAPI.o: LinkedListAPI.c LinkedListAPI.h
	$(CC) $(CFLAGS) -c -fpic LinkedListAPI.c

clean:
	rm -rf VCParser *.o *.so
