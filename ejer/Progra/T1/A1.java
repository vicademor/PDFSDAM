import java.util.Scanner;

public class A3_1
{
    public static void main(String[] args)
    {
        Scanner sc = new Scanner(System.in);
        float precio, impuestos;
        System.out.println("Costes");
        System.out.println("Introducir el precio");
        precio = sc.nextInt ();
        System.out.println("Introducir los impuestos");
        impuestos = sc.nextInt ();
        precio = precio * (1 + impuestos/100);
        System.out.println(precio);
    }
}
