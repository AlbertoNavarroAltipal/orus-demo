const { IsString, IsBoolean, IsOptional, Length } = require("class-validator");
const { plainToInstance } = require("class-transformer");

class RoleCreateDto {
  @IsString({ message: "La descripción es obligatoria y debe ser texto." })
  @Length(10, 100, {
    message: "La descripción debe tener entre 10 y 100 caracteres.",
  })
  description;

  @IsOptional()
  @IsBoolean({ message: "El campo root debe ser verdadero o falso." })
  root;

  @IsOptional()
  @IsString({ message: "El campo created_by debe ser texto." })
  created_by;
}

function validateRoleCreateDto(body) {
  const dto = plainToInstance(RoleCreateDto, body);
  const { validateSync } = require("class-validator");
  const errors = validateSync(dto, { whitelist: true });
  if (errors.length > 0) {
    const detalles = errors
      .map((e) => Object.values(e.constraints))
      .flat()
      .join(" ");
    throw new Error(detalles);
  }
  return dto;
}

module.exports = { RoleCreateDto, validateRoleCreateDto };
// Moved to dto directory
